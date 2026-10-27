// ====================================================
// 🎁 routes/itemRoutes.js : API จัดการรายการสิ่งของ (Database)
// ====================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { emitToUser } = require('../utils/socketHelper');

const storage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, 'uploads/'),
   filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

const { addXP } = require('../utils/xpHelper');

// 📌 1. API ดึงรายการสิ่งของทั้งหมดจาก DB (เฉพาะที่อนุมัติแล้ว และยังมีของอยู่)
router.get('/items', (req, res) => {
    const { category, type, min_price, max_price, sort, search, lat, lng, max_distance, exclude_user_id } = req.query;
    let conditions = ['i.is_approved = TRUE', "i.status = 'available'", '(i.quantity > 0 OR i.quantity IS NULL)'];
    let params = [];

    // กรองไม่รวมของตนเองในหน้ารวม (เพื่อป้องกันความสับสน)
    if (exclude_user_id) {
        conditions.push('i.user_id != ?');
        params.push(exclude_user_id);
    }

    // Filter by distance if provided
    if (lat && lng && max_distance && max_distance !== 'all') {
        const d = Number(max_distance);
        if (d <= 50) {
            conditions.push(`(6371 * acos(cos(radians(?)) * cos(radians(i.latitude)) * cos(radians(i.longitude) - radians(?)) + sin(radians(?)) * sin(radians(i.latitude)))) <= ?`);
            params.push(Number(lat), Number(lng), Number(lat), d);
        }
    }

    if (search) {
        conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
        params.push('%' + search + '%', '%' + search + '%');
    }
    if (category) {
        conditions.push('i.category = ?');
        params.push(category);
    }
    if (type) {
        conditions.push('i.item_type = ?');
        params.push(type);
    }
    if (min_price) {
        conditions.push('i.price >= ?');
        params.push(Number(min_price));
    }
    if (max_price) {
        conditions.push('i.price <= ?');
        params.push(Number(max_price));
    }
    let orderClause = 'ORDER BY i.item_id DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY i.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY i.price DESC';
    else if (sort === 'oldest') orderClause = 'ORDER BY i.item_id ASC';

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(DISTINCT i.item_id) AS total FROM items i WHERE ${conditions.join(' AND ')}`;
    
    db.query(countSql, params, (countErr, countResult) => {
        if (countErr) {
            console.error('Count Items Error:', countErr);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = `
           SELECT i.*, 
                  u.name AS owner_name, 
                  u.level AS owner_level, 
                  u.xp AS owner_xp,
                  COALESCE(AVG(r.rating), 0) AS owner_rating,
                  COUNT(r.review_id) AS owner_review_count,
                  (SELECT COUNT(*) FROM item_requests req WHERE req.item_id = i.item_id AND req.status = 'pending') AS pending_requests,
                  (SELECT GROUP_CONCAT(img.image_url ORDER BY img.sort_order ASC) FROM item_images img WHERE img.item_id = i.item_id) AS gallery_images
           FROM items i
           JOIN users u ON u.user_id = i.user_id
           LEFT JOIN reviews r ON r.reviewee_id = i.user_id
           WHERE ${conditions.join(' AND ')}
           GROUP BY i.item_id
           ${orderClause}
           LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, limit, offset];
        db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error('Fetch Items Error:', err);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        const items = results.map(row => {
            let images = [];
            if (row.gallery_images) {
                images = row.gallery_images.split(',').filter(Boolean);
            } else if (row.image_url) {
                images = [row.image_url];
            }
            return { ...row, images };
        });
        res.json({ success: true, items, totalPages, totalItems, currentPage: page });
        });
    });
});

// 📌 1.1 API ดึงรายการสิ่งของทั้งหมดของผู้ใช้เอง (รวมทั้งที่รออนุมัติ / เปิดรับ / ปิดรับ พร้อมสรุปสถิติ)
router.get('/items/mine', requireAuth, (req, res) => {
    const user_id = req.authUser.userId;
    const { category, type, min_price, max_price, status_filter, search, sort } = req.query;

    let conditions = ['i.user_id = ?'];
    let params = [user_id];

    if (search) {
        conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
        params.push('%' + search + '%', '%' + search + '%');
    }
    if (category) {
        conditions.push('i.category = ?');
        params.push(category);
    }
    if (type) {
        conditions.push('i.item_type = ?');
        params.push(type);
    }
    if (min_price) {
        conditions.push('i.price >= ?');
        params.push(Number(min_price));
    }
    if (max_price) {
        conditions.push('i.price <= ?');
        params.push(Number(max_price));
    }
    if (status_filter === 'pending') {
        conditions.push('i.is_approved = 0');
    } else if (status_filter === 'approved') {
        conditions.push('i.is_approved = 1 AND i.status != "completed" AND (i.quantity > 0 OR i.quantity IS NULL)');
    } else if (status_filter === 'available') {
        conditions.push("i.status = 'available' AND i.is_approved = 1 AND (i.quantity > 0 OR i.quantity IS NULL)");
    } else if (status_filter === 'completed') {
        conditions.push("(i.status = 'completed' OR i.quantity <= 0)");
    } else if (status_filter === 'all') {
        // แสดงทั้งหมด รวมทั้งที่หมดแล้วและยังไม่หมด
    } else {
        // ค่าเริ่มต้น (Default): เอาออกจากหน้าเว็บเมื่อกดหมดแล้ว แต่ยังคงเก็บข้อมูลในฐานข้อมูลไว้
        conditions.push("i.status != 'completed' AND (i.quantity > 0 OR i.quantity IS NULL)");
    }

    let orderClause = 'ORDER BY i.item_id DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY i.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY i.price DESC';
    else if (sort === 'oldest') orderClause = 'ORDER BY i.item_id ASC';

    // ดึงสรุปสถิติรายการทั้งหมดของผู้ใช้
    const statsSql = `
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN is_approved = 0 THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'available' AND is_approved = 1 AND (quantity > 0 OR quantity IS NULL) THEN 1 ELSE 0 END) AS available,
            SUM(CASE WHEN status = 'completed' OR quantity <= 0 THEN 1 ELSE 0 END) AS completed
        FROM items WHERE user_id = ?
    `;

    db.query(statsSql, [user_id], (statsErr, statsRows) => {
        const stats = {
            total: statsRows?.[0]?.total || 0,
            pending: statsRows?.[0]?.pending || 0,
            available: statsRows?.[0]?.available || 0,
            completed: statsRows?.[0]?.completed || 0
        };

        const sql = `
           SELECT i.*, 
                  u.name AS owner_name, 
                  u.level AS owner_level, 
                  u.xp AS owner_xp,
                  COALESCE(AVG(r.rating), 0) AS owner_rating,
                  COUNT(r.review_id) AS owner_review_count,
                  (SELECT COUNT(*) FROM item_requests req WHERE req.item_id = i.item_id AND req.status = 'pending') AS pending_requests,
                  (SELECT GROUP_CONCAT(img.image_url ORDER BY img.sort_order ASC) FROM item_images img WHERE img.item_id = i.item_id) AS gallery_images
           FROM items i
           JOIN users u ON u.user_id = i.user_id
           LEFT JOIN reviews r ON r.reviewee_id = i.user_id
           WHERE ${conditions.join(' AND ')}
           GROUP BY i.item_id
           ${orderClause}
        `;

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Fetch My Items Error:', err);
                return res.status(500).json({ success: false, message: 'ดึงข้อมูลรายการของคุณไม่สำเร็จ' });
            }
            const items = results.map(row => {
                let images = [];
                if (row.gallery_images) {
                    images = row.gallery_images.split(',').filter(Boolean);
                } else if (row.image_url) {
                    images = [row.image_url];
                }
                return { ...row, images };
            });
            res.json({ success: true, items, stats, totalItems: items.length });
        });
    });
});

// 📌 2. API บันทึกรายการใหม่ลง DB
router.post('/items', requireAuth, upload.any(), (req, res) => {
   const { title, category, description, location, item_type, price, quantity, deposit } = req.body;
   const latitude = (req.body.latitude && req.body.latitude !== 'null') ? req.body.latitude : null;
   const longitude = (req.body.longitude && req.body.longitude !== 'null') ? req.body.longitude : null;
   const user_id = req.authUser.userId;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   // รองรับทั้งรูปเดียวและหลายรูป (สูงสุด 5 รูป)
   let uploadedFiles = [];
   if (req.files && req.files.length > 0) {
       const imagesFiles = req.files.filter(f => f.fieldname === 'images');
       if (imagesFiles.length > 0) {
           uploadedFiles = imagesFiles.slice(0, 5);
       } else {
           uploadedFiles = req.files.filter(f => f.fieldname === 'image').slice(0, 1);
       }
   } else if (req.file) {
       uploadedFiles = [req.file];
   }
   const uniqueFiles = uploadedFiles;

   let image_url = uniqueFiles.length > 0 ? `/uploads/${uniqueFiles[0].filename}` : '';

   const sql = `
      INSERT INTO items (title, category, description, image_url, location, latitude, longitude, status, user_id, item_type, price, deposit, quantity, is_approved) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?, ?, 0)
    `;

   db.query(sql, [title, category, description || '', image_url, location || '', latitude, longitude, user_id, item_type || 'free', price || 0, deposit || 0, quantity || 1], (err, result) => {
      if (err) {
         console.error('Post Item Error:', err);
         return res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกลงฐานข้อมูลได้' });
      }
      const newItemId = result.insertId;

      // 🔔 ส่งการแจ้งเตือนไปยังผู้ดูแลระบบ (Admin) ทุกคนว่ามีรายการใหม่รอตรวจสอบ
      db.query("SELECT user_id FROM users WHERE role = 'admin'", (admErr, adminRows) => {
          if (!admErr && adminRows && adminRows.length > 0) {
              const typeText = (item_type === 'rent') ? 'ปล่อยเช่า' : (item_type === 'sell') ? 'ขาย' : 'ส่งต่อฟรี';
              const notifMsg = `มีรายการ${typeText}ใหม่ "${title}" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน`;
              adminRows.forEach(adm => {
                  db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
                      [adm.user_id, user_id, 'item_pending', newItemId, notifMsg]
                  );
              });
          }
      });

      if (uniqueFiles.length > 0) {
          const imgValues = uniqueFiles.map((f, idx) => [newItemId, `/uploads/${f.filename}`, idx]);
          db.query('INSERT INTO item_images (item_id, image_url, sort_order) VALUES ?', [imgValues], (imgErr) => {
              if (imgErr) console.error('Insert item_images Error:', imgErr);
              res.json({ success: true, message: 'ลงประกาศสำเร็จ! กรุณารอแอดมินตรวจสอบก่อนแสดงผลบนหน้าเว็บ', item_id: newItemId });
          });
      } else {
          res.json({ success: true, message: 'ลงประกาศสำเร็จ! กรุณารอแอดมินตรวจสอบก่อนแสดงผลบนหน้าเว็บ', item_id: newItemId });
      }
   });
});

// 📌 3. API แก้ไขรายการของตัวเอง (รองรับอัปโหลดรูปภาพใหม่ได้สูงสุด 5 รูป)
router.put('/items/:itemId', requireAuth, upload.any(), (req, res) => {
   const { title, category, description, location, latitude, longitude, item_type, price, quantity, deposit } = req.body;
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   const lat = latitude ? Number(latitude) : null;
   const lng = longitude ? Number(longitude) : null;

   const values = [
      title.trim(), 
      category, 
      description || '', 
      location || '', 
      lat, 
      lng, 
      lat, 
      lng, 
      item_type || 'free', 
      Number(price) || 0, 
      Number(deposit) || 0, 
      Number(quantity) || 1
   ];

   let sql = `
      UPDATE items
      SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, lat = ?, lng = ?, item_type = ?, price = ?, deposit = ?, quantity = ?, is_approved = 0, is_edited = 1
   `;

   // รวบรวมไฟล์รูปภาพใหม่ (รองรับสูงสุด 5 รูป)
   let uploadedFiles = [];
   if (req.files && req.files.length > 0) {
       const imagesFiles = req.files.filter(f => f.fieldname === 'images');
       if (imagesFiles.length > 0) {
           uploadedFiles = imagesFiles.slice(0, 5);
       } else {
           uploadedFiles = req.files.filter(f => f.fieldname === 'image').slice(0, 5);
       }
   } else if (req.file) {
       uploadedFiles = [req.file];
   }

   let newPrimaryImageUrl = null;
   if (uploadedFiles.length > 0) {
      newPrimaryImageUrl = `/uploads/${uploadedFiles[0].filename}`;
      sql += ', image_url = ?';
      values.push(newPrimaryImageUrl);
   }

   sql += ' WHERE item_id = ? AND user_id = ?';
   values.push(itemId, user_id);

   db.query(sql, values, (err, result) => {
      if (err) {
         console.error('Update Item Error:', err);
         return res.status(500).json({ success: false, message: 'แก้ไขรายการไม่สำเร็จ' });
      }
      if (result.affectedRows === 0) {
         return db.query('SELECT item_id FROM items WHERE item_id = ? AND user_id = ?', [itemId, user_id], (checkErr, rows) => {
            if (checkErr) {
               return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
            }
            if (rows.length === 0) {
               return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์แก้ไขรายการนี้' });
            }
            res.json({ success: true, message: 'แก้ไขรายการสำเร็จ' });
         });
      }

      // 🔔 อัปเดตรูปภาพใหม่ทั้งหมดลงตาราง item_images (สูงสุด 5 รูป)
      if (uploadedFiles.length > 0) {
         db.query('DELETE FROM item_images WHERE item_id = ?', [itemId], (delErr) => {
            if (delErr) console.error('Delete old item_images Error:', delErr);
            const imgValues = uploadedFiles.map((f, idx) => [itemId, `/uploads/${f.filename}`, idx]);
            db.query('INSERT INTO item_images (item_id, image_url, sort_order) VALUES ?', [imgValues], (insErr) => {
               if (insErr) console.error('Insert new item_images Error:', insErr);
            });
         });
      }

      // 🔔 ส่งการแจ้งเตือนหาแอดมินทุกคนว่ามีรายการแก้ไขรอตรวจสอบ
      db.query("SELECT user_id FROM users WHERE role = 'admin'", (admErr, adminRows) => {
         if (!admErr && adminRows && adminRows.length > 0) {
            const typeText = (item_type === 'rent') ? 'ปล่อยเช่า' : (item_type === 'sell') ? 'ขาย' : 'ส่งต่อฟรี';
            const notifMsg = `รายการ${typeText} "${title.trim()}" ได้รับการแก้ไขข้อมูล รอแอดมินตรวจสอบความถูกต้องอีกครั้ง`;
            adminRows.forEach(adm => {
               db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
                  [adm.user_id, user_id, 'item_pending', itemId, notifMsg]
               );
            });
         }
      });

      res.json({ success: true, message: 'แก้ไขรายการสำเร็จ' });
   });
});

// 📌 4. API ลบรายการของตัวเอง
router.delete('/items/:itemId', requireAuth, (req, res) => {
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!user_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });
   }

   db.query('DELETE FROM items WHERE item_id = ? AND user_id = ?', [itemId, user_id], (err, result) => {
      if (err) {
         console.error('Delete Item Error:', err);
         return res.status(500).json({ success: false, message: 'ลบรายการไม่สำเร็จ' });
      }
      if (result.affectedRows === 0) {
         return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ลบรายการนี้' });
      }

      // เมื่อลบโพสต์แล้ว ลบห้องแชตและคำขอที่ผูกกับสินค้านี้ออกทั้งหมด
      db.query('SELECT id FROM chat_rooms WHERE item_id = ?', [itemId], (rErr, rRows) => {
         if (!rErr && rRows && rRows.length > 0) {
            const roomIds = rRows.map(r => r.id);
            db.query('DELETE FROM chat_messages WHERE room_id IN (?)', [roomIds]);
            db.query('DELETE FROM chat_room_members WHERE room_id IN (?)', [roomIds]);
            db.query('DELETE FROM chat_rooms WHERE id IN (?)', [roomIds]);
         }
      });
      db.query('DELETE FROM item_requests WHERE item_id = ?', [itemId]);
      db.query('DELETE FROM notifications WHERE reference_id = ?', [itemId]);

      res.json({ success: true, message: 'ลบรายการสำเร็จ' });
   });
});

// 📌 5. API ส่งคำขอรับรายการ
router.post('/items/:itemId/requests', requireAuth, (req, res) => {
   const { message } = req.body;
   const requester_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!requester_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ขอรับของ' });
   }

   db.query('SELECT item_id, user_id, status, title FROM items WHERE item_id = ?', [itemId], (itemErr, items) => {
      if (itemErr) return res.status(500).json({ success: false, message: 'ตรวจสอบรายการไม่สำเร็จ' });
      if (items.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายการนี้' });
      if (String(items[0].user_id) === String(requester_id)) {
         return res.status(400).json({ success: false, message: 'ไม่สามารถขอรับรายการของตัวเองได้' });
      }
      if (items[0].status !== 'available') {
         return res.status(400).json({ success: false, message: 'รายการนี้ไม่พร้อมให้ขอรับแล้ว' });
      }

      db.query(
         'INSERT INTO item_requests (item_id, requester_id, message) VALUES (?, ?, ?)',
         [itemId, requester_id, message || ''],
         (err, insertResult) => {
            if (err) {
               if (err.code === 'ER_DUP_ENTRY') {
                  return res.status(409).json({ success: false, message: 'คุณเคยส่งคำขอรายการนี้แล้ว' });
               }
               console.error('Create Item Request Error:', err);
               return res.status(500).json({ success: false, message: 'ส่งคำขอไม่สำเร็จ' });
            }
            
            // --- 🔔 แจ้งเตือนเจ้าของของ ---
            const titleMatch = items[0].title;
            const ownerId = items[0].user_id;
            const isRent = items[0].item_type === 'rent';
            const notifMsg = isRent ? `มีผู้ใช้ส่งคำขอนัดรับเช่า "${titleMatch}" ของคุณ` : `มีผู้ใช้สนใจขอรับ "${titleMatch}" ของคุณ`;
            db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)', 
                     [ownerId, requester_id, 'request_received', insertResult.insertId, notifMsg], (notifErr) => {
                if(notifErr) console.error(notifErr);
            });

            // 💬 บันทึกข้อความสรุปคำขอลงในห้องแชตอัตโนมัติ เพื่อเป็นหลักฐานทั้งสองฝ่าย
            const roomName = `รายการ: ${titleMatch}`;
            const findRoomSql = `
               SELECT r.id FROM chat_rooms r
               JOIN chat_room_members m1 ON m1.room_id = r.id AND m1.user_id = ?
               JOIN chat_room_members m2 ON m2.room_id = r.id AND m2.user_id = ?
               WHERE r.item_id = ?
               LIMIT 1
            `;
            db.query(findRoomSql, [requester_id, ownerId, itemId], (rFindErr, rRooms) => {
               const addMsgToRoom = (rId) => {
                  const reqUserName = req.authUser.name || 'ผู้ขอรับ';
                  const formattedMsg = `🤝 ส่งคำขอนัดรับ: "${titleMatch}"\n${message || 'สนใจรายการนี้ครับ/ค่ะ'}`;
                  db.query('INSERT INTO chat_messages (room_id, user_id, user_name, message) VALUES (?, ?, ?, ?)',
                     [rId, requester_id, reqUserName, formattedMsg], (msgErr, msgRes) => {
                        if (!msgErr && msgRes) {
                           emitToUser(ownerId, 'new_chat_message', {
                              room_id: Number(rId),
                              message: formattedMsg,
                              sender_name: reqUserName,
                              sender_id: requester_id,
                              id: msgRes.insertId,
                              created_at: new Date()
                           });
                        }
                     }
                  );
               };

               if (!rFindErr && rRooms && rRooms.length > 0) {
                  addMsgToRoom(rRooms[0].id);
               } else {
                  db.query('INSERT INTO chat_rooms (name, item_id) VALUES (?, ?)', [roomName, itemId], (crErr, crRes) => {
                     if (!crErr && crRes) {
                        const newRoomId = crRes.insertId;
                        db.query('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?), (?, ?)',
                           [newRoomId, requester_id, newRoomId, ownerId], (mErr) => {
                              if (!mErr) addMsgToRoom(newRoomId);
                           }
                        );
                     }
                  });
               }
            });

            // ⚡ Real-Time Socket Notification to Owner
            db.query('SELECT COUNT(*) AS pending_count FROM item_requests WHERE item_id = ? AND status = "pending"', [itemId], (cntErr, cntRows) => {
                const pendingCount = (cntRows && cntRows[0]) ? cntRows[0].pending_count : 1;
                emitToUser(ownerId, 'request_received', {
                    requestId: insertResult.insertId,
                    itemId: Number(itemId),
                    pendingCount: pendingCount,
                    requesterId: requester_id,
                    requesterName: req.authUser.name || 'มีผู้ใช้งาน',
                    itemTitle: titleMatch,
                    message: message || ''
                });
                emitToUser(ownerId, 'new_notification', {
                    type: 'request_received',
                    reference_id: insertResult.insertId,
                    message: notifMsg
                });
            });
            // -------------------------------
            res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });
         }
      );
   });
});

// 📌 6. API ดูคำขอของรายการตัวเอง
router.get('/items/:itemId/requests', requireAuth, (req, res) => {
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!user_id) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   const sql = `
      SELECT r.request_id, r.item_id, r.requester_id, r.message, r.status, r.created_at,
             u.name AS requester_name, u.email AS requester_email, u.phone AS requester_phone
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = r.requester_id
      WHERE r.item_id = ? AND i.user_id = ?
      ORDER BY r.request_id DESC
   `;
   db.query(sql, [itemId, user_id], (err, requests) => {
      if (err) {
         console.error('Fetch Item Requests Error:', err);
         return res.status(500).json({ success: false, message: 'ดึงคำขอไม่สำเร็จ' });
      }
      res.json({ success: true, requests });
   });
});

// 📌 7. API เจ้าของรายการยอมรับหรือปฏิเสธคำขอ
router.patch('/item-requests/:requestId', requireAuth, (req, res) => {
   const { status } = req.body;
   const user_id = req.authUser.userId;
   const { requestId } = req.params;

   if (!['accepted', 'rejected'].includes(status) || !user_id) {
      return res.status(400).json({ success: false, message: 'ข้อมูลคำขอไม่ถูกต้อง' });
   }

   const sql = `
      SELECT r.item_id, r.status AS request_status, i.item_type
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      WHERE r.request_id = ? AND i.user_id = ?
   `;
   db.query(sql, [requestId, user_id], (findErr, rows) => {
      if (findErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
      if (rows.length === 0) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์จัดการคำขอนี้' });
      if (rows[0].request_status !== 'pending') {
         return res.status(400).json({ success: false, message: 'คำขอนี้ถูกจัดการไปแล้ว' });
      }

      db.query('UPDATE item_requests SET status = ? WHERE request_id = ?', [status, requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'อัปเดตคำขอไม่สำเร็จ' });
         if (status === 'accepted') {
            // --- 🔔 แจ้งเตือนผู้ขอรับ ---
            db.query('SELECT r.requester_id, i.title FROM item_requests r JOIN items i ON r.item_id = i.item_id WHERE r.request_id = ?', [requestId], (err, notifRows) => {
                if(!err && notifRows.length > 0) {
                    const reqUserId = notifRows[0].requester_id;
                    const reqItemTitle = notifRows[0].title;
                    const notifMsg = `คำขอรับของ "${reqItemTitle}" ของคุณได้รับการอนุมัติแล้ว`;
                    db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
                             [reqUserId, user_id, 'request_accepted', requestId, notifMsg]);
                    emitToUser(reqUserId, 'request_status_updated', {
                        requestId,
                        itemId: rows[0].item_id,
                        status: 'accepted',
                        itemTitle: reqItemTitle,
                        message: notifMsg
                    });
                    emitToUser(reqUserId, 'new_notification', {
                        type: 'request_accepted',
                        reference_id: requestId,
                        message: notifMsg
                    });
                }
            });
            // -------------------------------
            // 🌟 ให้ XP แก่ผู้แจก/ผู้ขาย (+50 สำหรับแจกฟรี, +20 สำหรับขาย/เช่า)
            const xpGained = rows[0].item_type === 'free' ? 50 : 20;
            addXP(user_id, xpGained);

            const updateSql = `
               UPDATE items 
               SET quantity = GREATEST(quantity - 1, 0),
                   status = CASE WHEN GREATEST(quantity - 1, 0) <= 0 THEN 'reserved' ELSE 'available' END
               WHERE item_id = ?
            `;
            return db.query(updateSql, [rows[0].item_id], (itemErr) => {
               if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะรายการไม่สำเร็จ' });
               res.json({ success: true, message: `ยอมรับคำขอและปรับลดจำนวนสำเร็จ (ได้รับ +${xpGained} XP!)` });
            });
         }
         // ปฏิเสธคำขอ แจ้งเตือนคนขอแบบเรียลไทม์
         db.query('SELECT r.requester_id, i.title FROM item_requests r JOIN items i ON r.item_id = i.item_id WHERE r.request_id = ?', [requestId], (err, notifRows) => {
             if(!err && notifRows.length > 0) {
                 const reqUserId = notifRows[0].requester_id;
                 const reqItemTitle = notifRows[0].title;
                 const notifMsg = `คำขอรับของ "${reqItemTitle}" ของคุณไม่ได้รับการอนุมัติ`;
                 db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
                          [reqUserId, user_id, 'request_rejected', requestId, notifMsg]);
                 emitToUser(reqUserId, 'request_status_updated', {
                     requestId,
                     itemId: rows[0].item_id,
                     status: 'rejected',
                     itemTitle: reqItemTitle,
                     message: notifMsg
                 });
                 emitToUser(reqUserId, 'new_notification', {
                     type: 'request_rejected',
                     reference_id: requestId,
                     message: notifMsg
                 });
             }
         });
         res.json({ success: true, message: 'ปฏิเสธคำขอสำเร็จ' });
      });
   });
});

// 📌 8. API ดึงคำขอรับของทั้งหมดที่ผู้ใช้งานคนนี้เป็นคนส่ง (My Sent Requests)
router.get('/my-requests', requireAuth, (req, res) => {
   const requesterId = req.authUser.userId;

   const sql = `
      SELECT r.request_id, r.item_id, r.message, r.status, r.created_at,
             i.title AS item_title, i.category AS item_category, i.image_url AS item_image,
             i.item_type, i.price, i.quantity, i.user_id AS owner_id,
             u.name AS owner_name, u.email AS owner_email
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = i.user_id
      WHERE r.requester_id = ?
      ORDER BY r.request_id DESC
   `;
   db.query(sql, [requesterId], (err, requests) => {
      if (err) {
         console.error('Fetch My Requests Error:', err);
         return res.status(500).json({ success: false, message: 'ดึงรายการคำขอไม่สำเร็จ' });
      }
      res.json({ success: true, requests });
   });
});

// 📌 10. API ยืนยันการรับสินค้า (สำหรับผู้ซื้อ/ผู้รับ) -> ส่งข้อมูลกลับไปเปิด Modal รีวิว
router.patch('/item-requests/:requestId/confirm-received', requireAuth, (req, res) => {
   const requesterId = req.authUser.userId;
   const { requestId } = req.params;

   const sqlFind = `
      SELECT r.request_id, r.item_id, r.status AS request_status,
             i.title AS item_title, i.user_id AS owner_id, u.name AS owner_name, i.item_type
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = i.user_id
      WHERE r.request_id = ? AND r.requester_id = ?
   `;

   db.query(sqlFind, [requestId, requesterId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์คำขอไม่สำเร็จ' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบคำขอนี้หรือไม่มีสิทธิ์ดำเนินการ' });
      
      const reqData = rows[0];
      if (['returned', 'cancelled', 'rejected'].includes(reqData.request_status)) {
         return res.status(400).json({ success: false, message: 'คำขอนี้ถูกดำเนินการหรือยกเลิกไปแล้ว' });
      }

      // สำหรับการเช่า: เปลี่ยนสถานะเป็น 'renting' (กำลังเช่าอยู่) เพื่อให้แสดงปุ่มคืนของ
      // สำหรับการแจกฟรีหรือซื้อขาด: ปรับเป็น 'completed'
      const nextStatus = reqData.item_type === 'rent' ? 'renting' : 'completed';

      db.query('UPDATE item_requests SET status = ? WHERE request_id = ?', [nextStatus, requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'ยืนยันรับของไม่สำเร็จ' });

         // อัปเดตสถานะ item: สต็อกถูกหักไปแล้วตั้งแต่ตอนเจ้าของกดรับคำขอ (accept) จึงไม่หัก quantity ซ้ำอีก
         const updateItemSql = `
            UPDATE items i
            SET i.status = CASE 
               WHEN i.quantity > 0 THEN 'available'
               WHEN (SELECT COUNT(*) FROM item_requests r WHERE r.item_id = i.item_id AND r.status IN ('accepted', 'renting')) > 0 THEN 'reserved'
               ELSE 'completed'
            END
            WHERE i.item_id = ?
         `;
         db.query(updateItemSql, [reqData.item_id], (itemUpErr) => {
            if (itemUpErr) console.error('Update item status on confirm received error:', itemUpErr);
         });

         // ให้โบนัส XP ผู้ขาย/ผู้แจก +50 XP
         addXP(reqData.owner_id, 50);

         // แจ้งเตือนผู้แจก/ผู้ขายว่าผู้ขอรับยืนยันรับของแล้ว
         const notifMsg = reqData.item_type === 'rent'
            ? `ผู้เช่ายืนยันได้รับของ "${reqData.item_title}" แล้ว เริ่มต้นระยะเวลาเช่า`
            : `ผู้ขอรับยืนยันได้รับ "${reqData.item_title}" เรียบร้อยแล้ว`;

         db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
            [reqData.owner_id, requesterId, 'request_completed', requestId, notifMsg], (notifErr) => {
               if (!notifErr) {
                  emitToUser(reqData.owner_id, 'new_notification', {
                     type: 'request_completed',
                     reference_id: requestId,
                     message: notifMsg
                  });
               }
            }
         );

         res.json({
            success: true,
            message: reqData.item_type === 'rent' ? 'ยืนยันรับของเรียบร้อย เริ่มต้นระยะเวลาเช่าแล้ว!' : 'ยืนยันได้รับสินค้าเรียบร้อยแล้ว!',
            item_id: reqData.item_id,
            owner_id: reqData.owner_id,
            owner_name: reqData.owner_name,
            item_title: reqData.item_title
         });
      });
   });
});

// 📌 10.1 API ผู้เช่าแจ้งส่งคืนสินค้า (สำหรับของเช่า)
router.patch('/item-requests/:requestId/return', requireAuth, (req, res) => {
   const requesterId = req.authUser.userId;
   const { requestId } = req.params;

   const sqlFind = `
      SELECT r.request_id, r.item_id, r.status AS request_status,
             i.title AS item_title, i.user_id AS owner_id, u.name AS owner_name, i.item_type
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = i.user_id
      WHERE r.request_id = ? AND r.requester_id = ?
   `;

   db.query(sqlFind, [requestId, requesterId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์คำขอไม่สำเร็จ' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบคำขอนี้หรือไม่มีสิทธิ์ดำเนินการ' });

      const reqData = rows[0];
      if (['returning', 'returned', 'cancelled', 'rejected'].includes(reqData.request_status)) {
         return res.status(400).json({ success: false, message: 'คำขอนี้ไม่ได้อยู่ในสถานะที่สามารถส่งคืนได้' });
      }

      db.query('UPDATE item_requests SET status = "returning" WHERE request_id = ?', [requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'แจ้งส่งคืนสินค้าไม่สำเร็จ' });

         const notifMsg = `ผู้เช่าได้แจ้งส่งคืนสินค้า "${reqData.item_title}" แล้ว กรุณาตรวจรับของ`;
         db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
            [reqData.owner_id, requesterId, 'request_returning', requestId, notifMsg], () => {
               emitToUser(reqData.owner_id, 'new_notification', {
                  type: 'request_returning',
                  reference_id: requestId,
                  message: notifMsg
               });
            }
         );

         res.json({
            success: true,
            message: 'แจ้งส่งคืนสินค้าเรียบร้อยแล้ว รอผู้ปล่อยเช่าตรวจรับของ'
         });
      });
   });
});

// 📌 10.2 API เจ้าของกดยืนยันได้รับสินค้าคืนเรียบร้อย (คืนของเข้าสต็อก)
router.patch('/item-requests/:requestId/confirm-return', requireAuth, (req, res) => {
   const ownerId = req.authUser.userId;
   const { requestId } = req.params;

   const sqlFind = `
      SELECT r.request_id, r.item_id, r.status AS request_status, r.requester_id,
             i.title AS item_title, i.user_id AS owner_id, u.name AS requester_name, i.item_type
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = r.requester_id
      WHERE r.request_id = ? AND i.user_id = ?
   `;

   db.query(sqlFind, [requestId, ownerId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ตรวจสอบข้อมูลไม่สำเร็จ' });
      if (rows.length === 0) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์จัดการคำขอนี้' });

      const reqData = rows[0];
      if (reqData.request_status === 'returned') {
         return res.status(400).json({ success: false, message: 'คำขอนี้ได้รับการยืนยันคืนสินค้าไปแล้ว' });
      }

      db.query('UPDATE item_requests SET status = "returned" WHERE request_id = ?', [requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'ยืนยันรับคืนสินค้าไม่สำเร็จ' });

         // คืนสต็อกสินค้า +1 และเปิดสถานะเป็น available
         const restoreSql = `
            UPDATE items 
            SET quantity = quantity + 1,
                status = 'available'
            WHERE item_id = ?
         `;
         db.query(restoreSql, [reqData.item_id], (restoreErr) => {
            if (restoreErr) console.error('Restore item quantity error:', restoreErr);
         });

         // แจ้งเตือนผู้เช่า
         const notifMsg = `ผู้ปล่อยเช่าได้รับสินค้า "${reqData.item_title}" คืนเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ!`;
         db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
            [reqData.requester_id, ownerId, 'request_returned', requestId, notifMsg], () => {
               emitToUser(reqData.requester_id, 'new_notification', {
                  type: 'request_returned',
                  reference_id: requestId,
                  message: notifMsg
               });
            }
         );

         res.json({
            success: true,
            message: 'ตรวจรับสินค้าคืนเรียบร้อย นำสินค้ากลับเข้าสต็อกแล้ว'
         });
      });
   });
});

// 📌 11. API ผู้ซื้อขอยกเลิกคำขอ
router.delete('/item-requests/:requestId/cancel', requireAuth, (req, res) => {
   const requesterId = req.authUser.userId;
   const { requestId } = req.params;

   db.query('SELECT item_id, status FROM item_requests WHERE request_id = ? AND requester_id = ?', [requestId, requesterId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบคำขอนี้' });

      const reqStatus = rows[0].status;
      if (reqStatus === 'completed' || reqStatus === 'cancelled' || reqStatus === 'rejected') {
         return res.status(400).json({ success: false, message: 'ไม่สามารถยกเลิกคำขอนี้ได้' });
      }

      db.query('UPDATE item_requests SET status = "cancelled" WHERE request_id = ?', [requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'ยกเลิกไม่สำเร็จ' });
         
         if (reqStatus === 'accepted') {
            db.query("UPDATE items SET quantity = quantity + 1, status = CASE WHEN status = 'reserved' THEN 'available' ELSE status END WHERE item_id = ?", [rows[0].item_id]);
         }
         res.json({ success: true, message: 'ยกเลิกคำขอสำเร็จ' });
      });
   });
});

// 📌 12. API ผู้ขายขอยกเลิก/ยึดของคืน (กรณีคนซื้อเท)
router.patch('/item-requests/:requestId/revoke', requireAuth, (req, res) => {
   const ownerId = req.authUser.userId;
   const { requestId } = req.params;

   db.query(`
      SELECT r.item_id, r.status AS request_status 
      FROM item_requests r 
      JOIN items i ON r.item_id = i.item_id 
      WHERE r.request_id = ? AND i.user_id = ?
   `, [requestId, ownerId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่มีสิทธิ์จัดการ' });

      if (rows[0].request_status !== 'accepted') {
         return res.status(400).json({ success: false, message: 'คำขอนี้ไม่ได้อยู่ในสถานะที่ยึดคืนได้' });
      }

      db.query('UPDATE item_requests SET status = "cancelled" WHERE request_id = ?', [requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'ยึดคืนไม่สำเร็จ' });
         
         db.query("UPDATE items SET quantity = quantity + 1, status = CASE WHEN status = 'reserved' THEN 'available' ELSE status END WHERE item_id = ?", [rows[0].item_id]);
         res.json({ success: true, message: 'ยึดของคืนและนำกลับเข้าสต็อกสำเร็จ' });
      });
   });
});

// 📌 13. API ดึงข้อมูลโพสต์และคำขอของผู้ขาย
router.get('/my-sales', requireAuth, (req, res) => {
   const ownerId = req.authUser.userId;

   const sql = `
      SELECT i.item_id, i.title, i.category, i.image_url, i.item_type, i.price, i.quantity, i.status AS item_status,
             r.request_id, r.message, r.status AS request_status, r.created_at, r.updated_at,
             u.name AS requester_name, u.user_id AS requester_id, u.phone AS requester_phone
      FROM items i
      LEFT JOIN item_requests r ON i.item_id = r.item_id AND r.status IN ('pending', 'accepted', 'renting', 'returning', 'returned', 'completed')
      LEFT JOIN users u ON r.requester_id = u.user_id
      WHERE i.user_id = ?
      ORDER BY (CASE 
         WHEN r.status = 'returning' THEN 1 
         WHEN r.status = 'pending' THEN 2 
         WHEN r.status = 'accepted' THEN 3 
         WHEN r.status = 'renting' THEN 4 
         WHEN r.status = 'completed' THEN 5 
         ELSE 6 
      END) ASC, COALESCE(r.updated_at, r.created_at) DESC, i.item_id DESC
   `;
   db.query(sql, [ownerId], (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
      
      const salesMap = {};
      results.forEach(row => {
         if (!salesMap[row.item_id]) {
            salesMap[row.item_id] = {
               item_id: row.item_id, title: row.title, category: row.category, image_url: row.image_url,
               item_type: row.item_type, price: row.price, quantity: row.quantity, item_status: row.item_status,
               requests: []
            };
         }
         if (row.request_id) {
            salesMap[row.item_id].requests.push({
               request_id: row.request_id,
               requester_id: row.requester_id,
               requester_name: row.requester_name,
               requester_phone: row.requester_phone,
               message: row.message,
               status: row.request_status,
               created_at: row.created_at,
               updated_at: row.updated_at
            });
         }
      });
      // Sort sales array so items with active requests come first!
      const salesList = Object.values(salesMap).sort((a, b) => {
         const aActive = a.requests.some(r => ['pending', 'accepted', 'renting', 'returning'].includes(r.status)) ? 1 : 0;
         const bActive = b.requests.some(r => ['pending', 'accepted', 'renting', 'returning'].includes(r.status)) ? 1 : 0;
         if (aActive !== bActive) return bActive - aActive;
         return b.requests.length - a.requests.length;
      });
      res.json({ success: true, sales: salesList });
   });
});

// 📌 14. API ให้เจ้าของสลับสถานะสินค้า (เช่น แจกหมดแล้ว / ยังไม่หมด)
router.patch('/items/:itemId/toggle-status', requireAuth, (req, res) => {
   const ownerId = req.authUser.userId;
   const { itemId } = req.params;

   db.query('SELECT status, quantity FROM items WHERE item_id = ? AND user_id = ?', [itemId, ownerId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ตรวจสอบข้อมูลไม่สำเร็จ' });
      if (rows.length === 0) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์จัดการรายการนี้' });

      const currentStatus = rows[0].status;
      const newStatus = (currentStatus === 'completed' || currentStatus === 'reserved') ? 'available' : 'completed';
      const newQuantity = newStatus === 'available' ? (rows[0].quantity > 0 ? rows[0].quantity : 1) : 0;

      db.query('UPDATE items SET status = ?, quantity = ? WHERE item_id = ? AND user_id = ?', 
         [newStatus, newQuantity, itemId, ownerId], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะไม่สำเร็จ' });
            res.json({
               success: true,
               message: newStatus === 'completed' ? 'ทำเครื่องหมายว่า "แจกหมดแล้ว" เรียบร้อย' : 'เปิดรายการเป็น "พร้อมแจก/พร้อมใช้งาน" เรียบร้อย',
               status: newStatus,
               quantity: newQuantity
            });
      });
   });
});


// 📌 15. API รวมจำนวนตัวเลขแจ้งเตือนทุกเมนูของผู้ใช้
router.get('/user-badges', requireAuth, (req, res) => {
    const userId = req.authUser.userId;

    const q1 = "SELECT COUNT(*) AS count FROM item_requests WHERE requester_id = ? AND status IN ('pending', 'accepted')";
    const q2 = "SELECT COUNT(*) AS count FROM item_requests r JOIN items i ON r.item_id = i.item_id WHERE i.user_id = ? AND r.status = 'pending'";
    const q3 = "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0";
    const q4 = "SELECT COUNT(*) AS count FROM chat_messages m JOIN chat_room_members crm ON m.room_id = crm.room_id AND crm.user_id = ? WHERE m.sender_id != ? AND m.is_read = 0";
    const q5 = "SELECT COUNT(*) AS count FROM transactions WHERE (buyer_id = ? OR seller_id = ?) AND status IN ('pending_payment', 'slip_uploaded', 'paid_held', 'in_rental', 'returning', 'damage_claimed')";

    db.query(q1, [userId], (err1, r1) => {
        db.query(q2, [userId], (err2, r2) => {
            db.query(q3, [userId], (err3, r3) => {
                db.query(q4, [userId, userId], (err4, r4) => {
                    db.query(q5, [userId, userId], (err5, r5) => {
                        res.json({
                            success: true,
                            badges: {
                                myRequests: (r1 && r1[0]) ? r1[0].count : 0,
                                mySales: (r2 && r2[0]) ? r2[0].count : 0,
                                notifications: (r3 && r3[0]) ? r3[0].count : 0,
                                chat: (r4 && r4[0]) ? r4[0].count : 0,
                                transactions: (r5 && r5[0]) ? r5[0].count : 0
                            }
                        });
                    });
                });
            });
        });
    });
});

module.exports = router;
