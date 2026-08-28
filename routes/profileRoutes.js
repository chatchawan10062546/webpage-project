// ====================================================
// 👤 profileRoutes.js : API ข้อมูลโปรไฟล์และรายการของผู้ใช้
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

function getUserId(req) {
   return req.authUser.userId;
}

router.get('/profile', requireAuth, (req, res) => {
   const userId = getUserId(req);
   if (!userId) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   db.query(
      'SELECT user_id, name, email, phone, role, created_at FROM users WHERE user_id = ?',
      [userId],
      (err, users) => {
         if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ' });
         if (users.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
         res.json({ success: true, profile: users[0] });
      }
   );
});

router.get('/profile/items', requireAuth, (req, res) => {
   const userId = getUserId(req);
   if (!userId) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   db.query(
      'SELECT item_id, title, category, item_type, price, status, image_url, created_at FROM items WHERE user_id = ? ORDER BY item_id DESC',
      [userId],
      (err, items) => {
         if (err) return res.status(500).json({ success: false, message: 'ดึงรายการของฉันไม่สำเร็จ' });
         res.json({ success: true, items });
      }
   );
});

router.put('/profile', requireAuth, (req, res) => {
   const { name, phone } = req.body;
   const user_id = req.authUser.userId;
   if (!user_id || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้' });
   }

   db.query(
      'UPDATE users SET name = ?, phone = ? WHERE user_id = ?',
      [name.trim(), phone || '', user_id],
      (err, result) => {
         if (err) return res.status(500).json({ success: false, message: 'บันทึกโปรไฟล์ไม่สำเร็จ' });
         if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
         res.json({ success: true, message: 'บันทึกโปรไฟล์สำเร็จ', profile: { user_id, name: name.trim(), phone: phone || '' } });
      }
   );
});

module.exports = router;
