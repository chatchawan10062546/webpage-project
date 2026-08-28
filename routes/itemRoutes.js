// ====================================================
// 🎁 routes/itemRoutes.js : API จัดการสิ่งของแจก + อัปโหลดรูปภาพ
// ====================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');

// ตั้งค่าที่เก็บรูปภาพอัปโหลด
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'uploads/');
   },
   filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
   }
});

const upload = multer({ storage: storage });

// API ลงประกาศแจกของ (/api/items)
router.post('/items', upload.single('image'), (req, res) => {
   const { title, category, description, location, user_id } = req.body;

   if (!title || !category || !user_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
   }

   let image_url = '';
   if (req.file) {
      image_url = `http://localhost:3000/uploads/${req.file.filename}`;
   }

   const sql = `
        INSERT INTO items (title, category, description, image_url, location, status, user_id) 
        VALUES (?, ?, ?, ?, ?, 'available', ?)
    `;

   db.query(sql, [title, category, description || '', image_url, location || '', user_id], (err, result) => {
      if (err) {
         console.error('Post Item Error:', err);
         return res.status(500).json({ success: false, message: 'ไม่สามารถลงประกาศได้' });
      }
      res.json({ success: true, message: 'ลงประกาศแจกของสำเร็จ!', item_id: result.insertId });
   });
});

module.exports = router;