// ====================================================
// 🛡️ adminRoutes.js : API หลังบ้านสำหรับผู้ดูแลระบบ
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/admin/summary', requireAdmin, (req, res) => {
    const queries = {
        users: 'SELECT COUNT(*) AS total FROM users',
        items: 'SELECT COUNT(*) AS total FROM items',
        pendingReports: "SELECT COUNT(*) AS total FROM reports WHERE status = 'pending'",
        transactions: 'SELECT COUNT(*) AS total FROM transactions'
    };
    const keys = Object.keys(queries);
    const summary = {};
    let completed = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดสรุปข้อมูลไม่สำเร็จ' });
            summary[key] = rows[0].total;
            completed += 1;
            if (completed === keys.length) res.json({ success: true, summary });
        });
    });
});

router.get('/admin/reports', requireAdmin, (req, res) => {
    const status = ['pending', 'resolved'].includes(req.query.status) ? req.query.status : null;
    const sql = `
        SELECT r.report_id, r.item_id, i.title AS item_title, i.status AS item_status,
               r.reporter_id, u.name AS reporter_name, u.email AS reporter_email,
               r.reason, r.status, r.created_at
        FROM reports r
        JOIN items i ON i.item_id = r.item_id
        JOIN users u ON u.user_id = r.reporter_id
        ${status ? 'WHERE r.status = ?' : ''}
        ORDER BY r.report_id DESC
    `;
    db.query(sql, status ? [status] : [], (err, reports) => {
        if (err) return res.status(500).json({ success: false, message: 'โหลดรายงานไม่สำเร็จ' });
        res.json({ success: true, reports });
    });
});

router.get('/admin/users', requireAdmin, (req, res) => {
    db.query(
        'SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY user_id DESC',
        (err, users) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดผู้ใช้ไม่สำเร็จ' });
            res.json({ success: true, users });
        }
    );
});

router.get('/admin/items', requireAdmin, (req, res) => {
    db.query(
        `SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.status,
                i.image_url, i.created_at, u.name AS owner_name, u.email AS owner_email
         FROM items i JOIN users u ON u.user_id = i.user_id
         ORDER BY i.item_id DESC`,
        (err, items) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดสินค้าไม่สำเร็จ' });
            res.json({ success: true, items });
        }
    );
});

router.get('/admin/transactions', requireAdmin, (req, res) => {
    db.query(
        `SELECT t.trans_id, t.item_id, i.title AS item_title, t.amount, t.status,
                t.payment_status, t.shipping_status, t.tracking_number,
                g.name AS giver_name, r.name AS receiver_name, t.created_at
         FROM transactions t
         JOIN items i ON i.item_id = t.item_id
         JOIN users g ON g.user_id = t.giver_id
         JOIN users r ON r.user_id = t.receiver_id
         ORDER BY t.trans_id DESC`,
        (err, transactions) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดธุรกรรมไม่สำเร็จ' });
            res.json({ success: true, transactions });
        }
    );
});

router.patch('/admin/reports/:reportId', requireAdmin, (req, res) => {
    const { status } = req.body;
    if (!['pending', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'สถานะรายงานไม่ถูกต้อง' });
    }
    db.query(
        'UPDATE reports SET status = ? WHERE report_id = ?',
        [status, req.params.reportId],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตรายงานไม่สำเร็จ' });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายงาน' });
            res.json({ success: true, message: 'อัปเดตรายงานสำเร็จ' });
        }
    );
});

module.exports = router;
