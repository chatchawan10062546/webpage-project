// ====================================================
// 🔐 routes/authRoutes.js : API ระบบสมาชิก (Register & Login)
// ====================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ดึงไฟล์เชื่อมฐานข้อมูลมาใช้
const { jwtSecret } = require('../middleware/authMiddleware');

// 1. API สมัครสมาชิก (/api/register)
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)';
        
        db.query(sql, [name, email, hashedPassword, phone || ''], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
                }
                return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
            }
            res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ!' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
});

// 2. API เข้าสู่ระบบ (/api/login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // 📌 ปริ้นดูข้อมูลผู้ใช้ใน Terminal ฝั่ง Server เพื่อความชัวร์
        console.log('👤 User Data from Database:', user);

        // 📌 ดึง ID ไม่ว่าจะชื่ออะไรก็ตามใน Database
        const userId = user.id || user.user_id || user.userId || user.ID || user.User_ID;

        if (!userId) {
            return res.status(500).json({ success: false, message: 'ไม่พบรหัสผู้ใช้ในฐานข้อมูล' });
        }

        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token: jwt.sign({ userId, name: user.name }, jwtSecret, { expiresIn: '7d' }),
            user: { 
                id: userId,
                user_id: userId,
                name: user.name, 
                email: user.email, 
                phone: user.phone 
            }
        });
    });
});
module.exports = router;