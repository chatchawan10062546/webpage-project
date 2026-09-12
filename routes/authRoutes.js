// ====================================================
// 🔐 routes/authRoutes.js : API ระบบสมาชิก (Register, Login, OTP, Google Auth)
// ====================================================
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // ดึงไฟล์เชื่อมฐานข้อมูลมาใช้
const { jwtSecret } = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ตั้งค่า transporter สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// ฟังก์ชันสุ่ม OTP 6 หลัก
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. API สมัครสมาชิก (/api/register)
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // หมดอายุใน 10 นาที

        const sql = 'INSERT INTO users (name, email, password, phone, otp_code, otp_expires_at, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        db.query(sql, [name, email, hashedPassword, phone || '', otpCode, otpExpiresAt, false], async (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ success: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' });
                }
                return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
            }

            // แสดง OTP ใน Terminal สำหรับใช้ทดสอบโดยไม่ต้องตั้งค่าอีเมลจริง
            console.log(`\n=========================================`);
            console.log(`📧 ส่ง OTP สำหรับอีเมล: ${email}`);
            console.log(`🔑 รหัส OTP ของคุณคือ: ${otpCode}`);
            console.log(`=========================================\n`);

            // ลองส่งอีเมลจริง (ถ้าตั้งค่าไว้)
            try {
                if(process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com') {
                    await transporter.sendMail({
                        from: `"ปันสุข (PanSuk)" <${process.env.SMTP_USER}>`,
                        to: email,
                        subject: 'รหัสยืนยันอีเมลของคุณ (OTP)',
                        text: `สวัสดีคุณ ${name},\n\nรหัส OTP สำหรับยืนยันอีเมลของคุณคือ: ${otpCode}\nรหัสมีอายุการใช้งาน 10 นาที\n\nขอบคุณที่เข้าร่วมกับเรา`
                    });
                }
            } catch (mailErr) {
                console.warn('⚠️ ไม่สามารถส่งอีเมลได้ (ให้ดู OTP จาก Terminal แทน):', mailErr.message);
            }

            res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ! กรุณายืนยันรหัส OTP ที่ส่งไปยังอีเมลของคุณ', email: email });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
});

// 1.5 API ยืนยัน OTP (/api/verify-otp)
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND auth_provider = "local"';
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
        
        const user = results[0];

        if (user.is_email_verified) {
            return res.status(400).json({ success: false, message: 'อีเมลนี้ยืนยันไปแล้ว' });
        }

        if (user.otp_code !== otp) {
            return res.status(400).json({ success: false, message: 'รหัส OTP ไม่ถูกต้อง' });
        }

        if (new Date(user.otp_expires_at) < new Date()) {
            return res.status(400).json({ success: false, message: 'รหัส OTP หมดอายุแล้ว' });
        }

        // ยืนยันสำเร็จ อัปเดตสถานะ
        db.query('UPDATE users SET is_email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE email = ?', [email], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: 'อัปเดตข้อมูลไม่สำเร็จ' });
            
            const userId = user.user_id;
            const token = jwt.sign({ userId, name: user.name, role: user.role }, jwtSecret, { expiresIn: '7d' });

            res.json({
                success: true,
                message: 'ยืนยันอีเมลและเข้าสู่ระบบสำเร็จ',
                token,
                user: { id: userId, user_id: userId, name: user.name, email: user.email, phone: user.phone, role: user.role }
            });
        });
    });
});

// 2. API เข้าสู่ระบบ (/api/login)
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND auth_provider = "local"';
    db.query(sql, [email], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        if (user.is_banned) {
            return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราวหรือถาวร กรุณาติดต่อแอดมิน' });
        }

        if (!user.is_email_verified) {
            return res.status(403).json({ success: false, message: 'กรุณายืนยันอีเมล (OTP) ก่อนเข้าสู่ระบบ', requires_otp: true, email: user.email });
        }

        const userId = user.user_id;

        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            token: jwt.sign({ userId, name: user.name, role: user.role }, jwtSecret, { expiresIn: '7d' }),
            user: { 
                id: userId,
                user_id: userId,
                name: user.name, 
                email: user.email, 
                phone: user.phone,
                role: user.role
            }
        });
    });
});

// 3. API เข้าสู่ระบบด้วย Google (/api/auth/google)
router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: 'ไม่พบ Token จาก Google' });

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'ระบบขัดข้อง' });

            if (results.length > 0) {
                // ผู้ใช้มีอยู่แล้ว
                const user = results[0];
                // ถ้าสมัครด้วยอีเมลปกติไปแล้ว และมากดเข้าด้วย Google ให้ผูกบัญชีเลย
                if(user.auth_provider === 'local' && !user.google_id) {
                     db.query('UPDATE users SET google_id = ?, is_email_verified = TRUE WHERE email = ?', [googleId, email]);
                }
                if (user.is_banned) {
                    return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งานชั่วคราวหรือถาวร กรุณาติดต่อแอดมิน' });
                }
                const userId = user.user_id;
                res.json({
                    success: true, message: 'เข้าสู่ระบบสำเร็จ',
                    token: jwt.sign({ userId, name: user.name, role: user.role }, jwtSecret, { expiresIn: '7d' }),
                    user: { id: userId, user_id: userId, name: user.name, email: user.email, phone: user.phone, role: user.role }
                });
            } else {
                // ผู้ใช้ใหม่
                const insertSql = 'INSERT INTO users (name, email, is_email_verified, auth_provider, google_id) VALUES (?, ?, TRUE, "google", ?)';
                db.query(insertSql, [name, email, googleId], (insertErr, result) => {
                    if (insertErr) return res.status(500).json({ success: false, message: 'สร้างบัญชี Google ไม่สำเร็จ' });
                    
                    const userId = result.insertId;
                    res.json({
                        success: true, message: 'สมัครสมาชิกและเข้าสู่ระบบสำเร็จ',
                        token: jwt.sign({ userId, name, role: 'user' }, jwtSecret, { expiresIn: '7d' }),
                        user: { id: userId, user_id: userId, name: name, email: email, phone: '', role: 'user' }
                    });
                });
            }
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ success: false, message: 'การยืนยันตัวตนกับ Google ล้มเหลว' });
    }
});

module.exports = router;