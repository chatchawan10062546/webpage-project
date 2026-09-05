// ====================================================
// 🚩 reportRoutes.js : API แจ้งปัญหาสินค้า
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/reports', requireAuth, (req, res) => {
    const { item_id, reason } = req.body;
    const reporterId = req.authUser.userId;

    if (!item_id || !reason?.trim()) {
        return res.status(400).json({ success: false, message: 'กรุณาเลือกสินค้าและระบุปัญหา' });
    }

    db.query('SELECT item_id FROM items WHERE item_id = ?', [item_id], (itemErr, items) => {
        if (itemErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสินค้าไม่สำเร็จ' });
        if (items.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบสินค้าที่แจ้งปัญหา' });

        db.query(
            'INSERT INTO reports (item_id, reporter_id, reason) VALUES (?, ?, ?)',
            [item_id, reporterId, reason.trim()],
            (reportErr, result) => {
                if (reportErr) {
                    console.error('Create Report Error:', reportErr);
                    return res.status(500).json({ success: false, message: 'บันทึกปัญหาไม่สำเร็จ' });
                }
                res.json({ success: true, report_id: result.insertId, message: 'ส่งแจ้งปัญหาให้ทีมงานแล้ว' });
            }
        );
    });
});

router.get('/reports/mine', requireAuth, (req, res) => {
    db.query(
        `SELECT r.report_id, r.item_id, i.title AS item_title, r.reason, r.status, r.created_at
         FROM reports r
         JOIN items i ON i.item_id = r.item_id
         WHERE r.reporter_id = ?
         ORDER BY r.report_id DESC`,
        [req.authUser.userId],
        (err, reports) => {
            if (err) return res.status(500).json({ success: false, message: 'ดึงประวัติแจ้งปัญหาไม่สำเร็จ' });
            res.json({ success: true, reports });
        }
    );
});

module.exports = router;
