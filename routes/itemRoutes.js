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
    const sql = 'SELECT * FROM items ORDER BY id DESC';
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

module.exports = router;