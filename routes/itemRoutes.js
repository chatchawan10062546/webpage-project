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

module.exports = router;