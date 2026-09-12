// ====================================================
// ⭐ reviewRoutes.js : API สำหรับระบบรีวิวและโปรไฟล์สถิติ
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');
const { addXP } = require('../utils/xpHelper');

// 📌 1. ส่งรีวิวให้ผู้ใช้งาน (Reviewer -> Reviewee)
router.post('/reviews', requireAuth, (req, res) => {
    const { item_id, reviewee_id, rating, comment } = req.body;
    const reviewerId = req.authUser.userId;

    if (!reviewee_id || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุผู้ถูกรีวิวและให้คะแนน 1-5 ดาว' });
    }

    if (String(reviewerId) === String(reviewee_id)) {
        return res.status(400).json({ success: false, message: 'ไม่สามารถให้คะแนนรีวิวตัวเองได้' });
    }

    db.query(
        'INSERT INTO reviews (item_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [item_id || null, reviewerId, reviewee_id, Number(rating), comment ? comment.trim() : ''],
        (err, result) => {
            if (err) {
                console.error('Create Review Error:', err);
                return res.status(500).json({ success: false, message: 'บันทึกรีวิวไม่สำเร็จ' });
            }

            // 🌟 มอบ XP ให้ผู้ถูกรีวิว (ถ้าได้ 5 ดาวได้ 20 XP, ได้ดาวลดลงมาตามสัดส่วน)
            const bonusXP = Number(rating) === 5 ? 20 : Number(rating) * 3;
            addXP(reviewee_id, bonusXP);

            res.json({ success: true, message: 'บันทึกรีวิวสำเร็จเรียบร้อยแล้ว!' });
        }
    );
});

// 📌 2. ดึงรายการรีวิวทั้งหมดของผู้ใช้งานคนหนึ่ง (Reviewee)
router.get('/users/:userId/reviews', (req, res) => {
    const { userId } = req.params;
    const sql = `
        SELECT r.review_id, r.rating, r.comment, r.created_at,
               u.name AS reviewer_name, i.title AS item_title
        FROM reviews r
        JOIN users u ON u.user_id = r.reviewer_id
        LEFT JOIN items i ON i.item_id = r.item_id
        WHERE r.reviewee_id = ?
        ORDER BY r.review_id DESC
    `;
    db.query(sql, [userId], (err, reviews) => {
        if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลรีวิวไม่สำเร็จ' });
        res.json({ success: true, reviews });
    });
});

// 📌 3. ดึงสถิติและข้อมูลโปรไฟล์สาธารณะของผู้ใช้ (Level, XP, Rating, Total Reviews)
router.get('/users/:userId/profile-stats', (req, res) => {
    const { userId } = req.params;
    const sqlUser = `
        SELECT user_id, name, email, role, level, xp, created_at
        FROM users WHERE user_id = ?
    `;
    db.query(sqlUser, [userId], (err, users) => {
        if (err || users.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งานนี้' });

        const user = users[0];
        
        // ดึงคะแนนดาวเฉลี่ย + จำนวนรีวิว + จำนวนของที่แจกสำเร็จ
        const sqlStats = `
            SELECT 
                (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewee_id = ?) AS avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?) AS review_count,
                (SELECT COUNT(*) FROM items WHERE user_id = ? AND status = 'completed') AS items_given
        `;
        db.query(sqlStats, [userId, userId, userId], (statErr, statRows) => {
            if (statErr) return res.status(500).json({ success: false, message: 'ดึงสถิติไม่สำเร็จ' });
            
            const stats = statRows[0] || { avg_rating: 0, review_count: 0, items_given: 0 };
            res.json({
                success: true,
                profile: {
                    ...user,
                    avg_rating: Number(stats.avg_rating).toFixed(1),
                    review_count: stats.review_count,
                    items_given: stats.items_given
                }
            });
        });
    });
});

module.exports = router;

