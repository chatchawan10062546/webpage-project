// ====================================================
// 🎁 routes/itemRoutes.js : API จัดการรายการสิ่งของ (Database)
// ====================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, 'uploads/'),
   filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

const { addXP } = require('../utils/xpHelper');

// 📌 1. API ดึงรายการสิ่งของทั้งหมดจาก DB (เฉพาะที่อนุมัติแล้ว)
router.get('/items', (req, res) => {
   const sql = `
       SELECT i.*, 
              u.name AS owner_name, 
              u.level AS owner_level, 
              u.xp AS owner_xp,
              COALESCE(AVG(r.rating), 0) AS owner_rating,
              COUNT(r.review_id) AS owner_review_count,
              (SELECT COUNT(*) FROM item_requests req WHERE req.item_id = i.item_id AND req.status = "pending") AS pending_requests
       FROM items i
       JOIN users u ON u.user_id = i.user_id
       LEFT JOIN reviews r ON r.reviewee_id = i.user_id
       WHERE i.is_approved = TRUE AND i.status != 'completed'
       GROUP BY i.item_id
       ORDER BY i.item_id DESC
   `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch Items Error:', err);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        res.json({ success: true, items: results });
    });
});

// 📌 2. API บันทึกรายการใหม่ลง DB
router.post('/items', requireAuth, upload.single('image'), (req, res) => {
   const { title, category, description, location, item_type, price, quantity } = req.body;
   const latitude = (req.body.latitude && req.body.latitude !== 'null') ? req.body.latitude : null;
   const longitude = (req.body.longitude && req.body.longitude !== 'null') ? req.body.longitude : null;
   const user_id = req.authUser.userId;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   let image_url = '';
   if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
   }

   const sql = `
      INSERT INTO items (title, category, description, image_url, location, latitude, longitude, status, user_id, item_type, price, quantity) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', ?, ?, ?, ?)
    `;

   db.query(sql, [title, category, description || '', image_url, location || '', latitude, longitude, user_id, item_type || 'free', price || 0, quantity || 1], (err, result) => {
      if (err) {
         console.error('Post Item Error:', err);
         return res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกลงฐานข้อมูลได้' });
      }
      res.json({ success: true, message: 'ลงประกาศสำเร็จ! กรุณารอแอดมินตรวจสอบก่อนแสดงผลบนหน้าเว็บ', item_id: result.insertId });
   });
});

// 📌 3. API แก้ไขรายการของตัวเอง
router.put('/items/:itemId', requireAuth, upload.single('image'), (req, res) => {
   const { title, category, description, location, latitude, longitude, item_type, price, quantity } = req.body;
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   const values = [title, category, description || '', location || '', latitude, longitude, item_type || 'free', price || 0, quantity || 1];
   let sql = `
      UPDATE items
      SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, item_type = ?, price = ?, quantity = ?, is_approved = 0, is_edited = 1
   `;

   if (req.file) {
      sql += ', image_url = ?';
      values.push(`/uploads/${req.file.filename}`);
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
            const notifMsg = `มีผู้ใช้สนใจขอรับ "${titleMatch}" ของคุณ`;
            db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)', 
                     [ownerId, requester_id, 'request_received', insertResult.insertId, notifMsg], (notifErr) => {
                if(notifErr) console.error(notifErr);
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
                }
            });
            // -------------------------------
            // 🌟 ให้ XP แก่ผู้แจก/ผู้ขาย (+50 สำหรับแจกฟรี, +20 สำหรับขาย/เช่า)
            const xpGained = rows[0].item_type === 'free' ? 50 : 20;
            addXP(user_id, xpGained);

            const updateSql = `
               UPDATE items 
               SET quantity = GREATEST(quantity - 1, 0),
                   status = CASE WHEN (quantity - 1) <= 0 THEN 'reserved' ELSE status END
               WHERE item_id = ?
            `;
            return db.query(updateSql, [rows[0].item_id], (itemErr) => {
               if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะรายการไม่สำเร็จ' });
               res.json({ success: true, message: `ยอมรับคำขอและปรับลดจำนวนสำเร็จ (ได้รับ +${xpGained} XP!)` });
            });
         }
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
             i.title AS item_title, i.user_id AS owner_id, u.name AS owner_name
      FROM item_requests r
      JOIN items i ON i.item_id = r.item_id
      JOIN users u ON u.user_id = i.user_id
      WHERE r.request_id = ? AND r.requester_id = ?
   `;

   db.query(sqlFind, [requestId, requesterId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์คำขอไม่สำเร็จ' });
      if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบคำขอนี้หรือไม่มีสิทธิ์ดำเนินการ' });
      
      const reqData = rows[0];
      if (['completed', 'cancelled', 'rejected'].includes(reqData.request_status)) {
         return res.status(400).json({ success: false, message: 'คำขอนี้ถูกดำเนินการหรือยกเลิกไปแล้ว' });
      }

      // อัปเดตสถานะคำขอเป็น completed
      db.query('UPDATE item_requests SET status = "completed" WHERE request_id = ?', [requestId], (updateErr) => {
         if (updateErr) return res.status(500).json({ success: false, message: 'ยืนยันรับของไม่สำเร็จ' });

         // ปรับสถานะ item เป็น completed และลดจำนวนลง 1 ชิ้น
         const updateItemSql = `
            UPDATE items 
            SET quantity = GREATEST(quantity - 1, 0),
                status = CASE WHEN (quantity - 1) <= 0 THEN 'completed' ELSE status END
            WHERE item_id = ?
         `;
         db.query(updateItemSql, [reqData.item_id]);

         // ให้โบนัส XP ผู้ขาย/ผู้แจก +50 XP
         addXP(reqData.owner_id, 50);

         res.json({
            success: true,
            message: 'ยืนยันได้รับสินค้าเรียบร้อยแล้ว!',
            item_id: reqData.item_id,
            owner_id: reqData.owner_id,
            owner_name: reqData.owner_name,
            item_title: reqData.item_title
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
             r.request_id, r.message, r.status AS request_status, r.created_at,
             u.name AS requester_name, u.user_id AS requester_id
      FROM items i
      LEFT JOIN item_requests r ON i.item_id = r.item_id AND r.status IN ('pending', 'accepted')
      LEFT JOIN users u ON r.requester_id = u.user_id
      WHERE i.user_id = ? AND i.status != 'completed'
      ORDER BY i.item_id DESC, r.created_at DESC
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
               message: row.message,
               status: row.request_status,
               created_at: row.created_at
            });
         }
      });
      res.json({ success: true, sales: Object.values(salesMap) });
   });
});

module.exports = router;
