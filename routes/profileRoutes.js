// ====================================================
// 👤 profileRoutes.js : API ข้อมูลโปรไฟล์และรายการของผู้ใช้
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

function getUserId(req) {
   return req.authUser ? req.authUser.userId : (req.query.user_id || req.body.user_id);
}

// 📌 11. API จัดการโปรไฟล์ผู้ใช้
router.get('/profile', (req, res, next) => {
   // optional auth: if bearer token provided, parse it; otherwise use user_id param
   if (req.headers.authorization) {
      return requireAuth(req, res, next);
   }
   next();
}, (req, res) => {
   const userId = getUserId(req);
   if (!userId) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   db.query(
      'SELECT user_id, name, email, phone, role, promptpay_number, promptpay_name, bank_name, bank_account, bank_account_name, payout_type, created_at FROM users WHERE user_id = ?',
      [userId],
      (err, users) => {
         if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลโปรไฟล์ไม่สำเร็จ' });
         if (users.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
         res.json({ success: true, profile: users[0] });
      }
   );
});

router.get('/profile/items', (req, res, next) => {
   if (req.headers.authorization) {
      return requireAuth(req, res, next);
   }
   next();
}, (req, res) => {
   const userId = getUserId(req);
   if (!userId) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   db.query(
      'SELECT item_id, title, category, item_type, price, quantity, status, is_approved, rejection_reason, image_url, created_at FROM items WHERE user_id = ? ORDER BY item_id DESC',
      [userId],
      (err, items) => {
         if (err) return res.status(500).json({ success: false, message: 'ดึงรายการของฉันไม่สำเร็จ' });
         res.json({ success: true, items });
      }
   );
});

router.put('/profile', (req, res, next) => {
   if (req.headers.authorization) {
      return requireAuth(req, res, next);
   }
   next();
}, (req, res) => {
   const { name, phone, promptpay_number, promptpay_name, bank_name, bank_account, bank_account_name, payout_type } = req.body;
   const user_id = getUserId(req);
   if (!user_id || !name?.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้' });
   }

   db.query(
      'UPDATE users SET name = ?, phone = ?, promptpay_number = ?, promptpay_name = ?, bank_name = ?, bank_account = ?, bank_account_name = ?, payout_type = ? WHERE user_id = ?',
      [
         name.trim(),
         phone || '',
         promptpay_number || '',
         promptpay_name || '',
         bank_name || '',
         bank_account || '',
         bank_account_name || '',
         payout_type || 'promptpay',
         user_id
      ],
      (err, result) => {
         if (err) return res.status(500).json({ success: false, message: 'บันทึกโปรไฟล์ไม่สำเร็จ: ' + err.message });
         if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
         res.json({
            success: true,
            message: 'บันทึกโปรไฟล์สำเร็จ',
            profile: {
               user_id,
               name: name.trim(),
               phone: phone || '',
               promptpay_number: promptpay_number || '',
               promptpay_name: promptpay_name || '',
               bank_name: bank_name || '',
               bank_account: bank_account || '',
               bank_account_name: bank_account_name || '',
               payout_type: payout_type || 'promptpay'
            }
         });
      }
   );
});

module.exports = router;
