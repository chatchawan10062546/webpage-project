// ====================================================
// 🎁 routes/itemRoutes.js : API จัดการรายการสิ่งของ (Database)
// ====================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

const storage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, 'uploads/'),
   filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const upload = multer({ storage: storage });

// 📌 1. API ดึงรายการสิ่งของทั้งหมดจาก DB
router.get('/items', (req, res) => {
   const sql = 'SELECT * FROM items ORDER BY item_id DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Fetch Items Error:', err);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        res.json({ success: true, items: results });
    });
});

// 📌 2. API บันทึกรายการใหม่ลง DB
router.post('/items', upload.single('image'), (req, res) => {
   const { title, category, description, location, user_id, item_type, price } = req.body;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   let image_url = '';
   if (req.file) {
      image_url = `http://localhost:3000/uploads/${req.file.filename}`;
   }

   const sql = `
        INSERT INTO items (title, category, description, image_url, location, status, user_id, item_type, price) 
        VALUES (?, ?, ?, ?, ?, 'available', ?, ?, ?)
    `;

   db.query(sql, [title, category, description || '', image_url, location || '', user_id, item_type || 'free', price || 0], (err, result) => {
      if (err) {
         console.error('Post Item Error:', err);
         return res.status(500).json({ success: false, message: 'ไม่สามารถบันทึกลงฐานข้อมูลได้' });
      }
      res.json({ success: true, message: 'ลงประกาศสำเร็จ!', item_id: result.insertId });
   });
});

// 📌 3. API แก้ไขรายการของตัวเอง
router.put('/items/:itemId', upload.single('image'), (req, res) => {
   const { title, category, description, location, user_id, item_type, price } = req.body;
   const { itemId } = req.params;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   const values = [title, category, description || '', location || '', item_type || 'free', price || 0];
   let sql = `
      UPDATE items
      SET title = ?, category = ?, description = ?, location = ?, item_type = ?, price = ?
   `;

   if (req.file) {
      sql += ', image_url = ?';
      values.push(`http://localhost:3000/uploads/${req.file.filename}`);
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

// 📌 4. API เปลี่ยนสถานะรายการของตัวเอง
router.patch('/items/:itemId/status', (req, res) => {
   const { status, user_id } = req.body;
   const { itemId } = req.params;
   const validStatuses = ['available', 'reserved', 'completed'];

   if (!validStatuses.includes(status) || !user_id) {
      return res.status(400).json({ success: false, message: 'สถานะหรือรหัสผู้ใช้ไม่ถูกต้อง' });
   }

   db.query(
      'UPDATE items SET status = ? WHERE item_id = ? AND user_id = ?',
      [status, itemId, user_id],
      (err, result) => {
         if (err) {
            console.error('Update Item Status Error:', err);
            return res.status(500).json({ success: false, message: 'เปลี่ยนสถานะไม่สำเร็จ' });
         }
         if (result.affectedRows === 0) {
            return db.query('SELECT item_id FROM items WHERE item_id = ? AND user_id = ?', [itemId, user_id], (checkErr, rows) => {
               if (checkErr) {
                  return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
               }
               if (rows.length === 0) {
                  return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เปลี่ยนสถานะรายการนี้' });
               }
               res.json({ success: true, message: 'เปลี่ยนสถานะสำเร็จ' });
            });
         }
         res.json({ success: true, message: 'เปลี่ยนสถานะสำเร็จ' });
      }
   );
});

// 📌 5. API ลบรายการของตัวเอง
router.delete('/items/:itemId', (req, res) => {
   const { user_id } = req.body;
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

// 📌 6. API ส่งคำขอรับรายการ
router.post('/items/:itemId/requests', (req, res) => {
   const { requester_id, message } = req.body;
   const { itemId } = req.params;

   if (!requester_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ขอรับของ' });
   }

   db.query('SELECT item_id, user_id, status FROM items WHERE item_id = ?', [itemId], (itemErr, items) => {
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
         (err) => {
            if (err) {
               if (err.code === 'ER_DUP_ENTRY') {
                  return res.status(409).json({ success: false, message: 'คุณเคยส่งคำขอรายการนี้แล้ว' });
               }
               console.error('Create Item Request Error:', err);
               return res.status(500).json({ success: false, message: 'ส่งคำขอไม่สำเร็จ' });
            }
            res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });
         }
      );
   });
});

// 📌 7. API ดูคำขอของรายการตัวเอง
router.get('/items/:itemId/requests', (req, res) => {
   const { user_id } = req.query;
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

// 📌 8. API เจ้าของรายการยอมรับหรือปฏิเสธคำขอ
router.patch('/item-requests/:requestId', (req, res) => {
   const { status, user_id } = req.body;
   const { requestId } = req.params;

   if (!['accepted', 'rejected'].includes(status) || !user_id) {
      return res.status(400).json({ success: false, message: 'ข้อมูลคำขอไม่ถูกต้อง' });
   }

   const sql = `
      SELECT r.item_id, r.status AS request_status
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
            return db.query('UPDATE items SET status = \'reserved\' WHERE item_id = ?', [rows[0].item_id], (itemErr) => {
               if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะรายการไม่สำเร็จ' });
               res.json({ success: true, message: 'ยอมรับคำขอและจองรายการสำเร็จ' });
            });
         }
         res.json({ success: true, message: 'ปฏิเสธคำขอสำเร็จ' });
      });
   });
});

module.exports = router;