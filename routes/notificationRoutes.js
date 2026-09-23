// ====================================================
// 🔔 routes/notificationRoutes.js : API สำหรับระบบแจ้งเตือน
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

// 📌 1. ดึงรายการแจ้งเตือนทั้งหมดของผู้ใช้ที่ล็อกอิน
router.get('/notifications', requireAuth, (req, res) => {
    const userId = req.authUser.userId;

    const sql = `
        SELECT n.notif_id, n.type, n.reference_id, n.message, n.is_read, n.created_at,
               u.name AS sender_name
        FROM notifications n
        LEFT JOIN users u ON n.sender_id = u.user_id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Fetch Notifications Error:', err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }

        const unreadCount = results.filter(n => !n.is_read).length;
        res.json({ success: true, notifications: results, unreadCount });
    });
});

// 📌 2. กดอ่านการแจ้งเตือน 1 รายการ
router.put('/notifications/:id/read', requireAuth, (req, res) => {
    const userId = req.authUser.userId;
    const notifId = req.params.id;

    db.query('UPDATE notifications SET is_read = TRUE WHERE notif_id = ? AND user_id = ?', [notifId, userId], (err) => {
        if (err) {
            console.error('Mark Notification Read Error:', err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }
        res.json({ success: true });
    });
});

// 📌 3. กดอ่านการแจ้งเตือนทั้งหมด
router.put('/notifications/read-all', requireAuth, (req, res) => {
    const userId = req.authUser.userId;

    db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [userId], (err) => {
        if (err) {
            console.error('Mark All Notifications Read Error:', err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
