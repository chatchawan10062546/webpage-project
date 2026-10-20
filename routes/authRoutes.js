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
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ตั้งค่า transporter สำหรับส่งอีเมล
const transporterConfig = (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')) || !process.env.SMTP_HOST
    ? {
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '')
        }
    }
    : {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
const transporter = nodemailer.createTransport(transporterConfig);

// ฟังก์ชันสุ่ม OTP 6 หลัก
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1. API สมัครสมาชิก (/api/register)
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // 🔒 ตรวจสอบความปลอดภัยของรหัสผ่านครบทั้ง 5 ข้อ:
    // 1. ความยาวอย่างน้อย 6 ตัวอักษร
    // 2. ตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว
    // 3. ตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว
    // 4. ตัวเลข (0-9) อย่างน้อย 1 ตัว
    // 5. อักขระพิเศษอย่างน้อย 1 ตัว
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว' });
    }
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว' });
    }
    if (!/[0-9]/.test(password)) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว' });
    }
    if (!specialCharRegex.test(password)) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอักขระพิเศษ (เช่น !@#$%) อย่างน้อย 1 ตัว' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // หมดอายุใน 10 นาที

        const sql = 'INSERT INTO users (name, email, password, phone, otp_code, otp_expires_at, is_email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)';
        
        db.query(sql, [name, email, hashedPassword, phone || '', otpCode, otpExpiresAt, false], (err, result) => {
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

            // ส่งอีเมลจริงแบบ Non-blocking (ไม่ต้องรอ await เพื่อให้หน้าเว็บสลับไปหน้า OTP ได้ทันที)
            const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com');
            if (isSmtpConfigured) {
                transporter.sendMail({
                    from: `"ปันสุข (PanSuk)" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: 'รหัสยืนยันอีเมลของคุณ (OTP)',
                    text: `สวัสดีคุณ ${name},\n\nรหัส OTP สำหรับยืนยันอีเมลของคุณคือ: ${otpCode}\nรหัสมีอายุการใช้งาน 10 นาที\n\nขอบคุณที่เข้าร่วมกับเรา`
                }).then(() => {
                    console.log(`✅ ส่งอีเมล OTP ไปยัง ${email} สำเร็จ!`);
                }).catch((mailErr) => {
                    console.warn('⚠️ ไม่สามารถส่งอีเมลได้ (ให้ดู OTP จาก Terminal แทน):', mailErr.message);
                });
            }

            res.json({
                success: true,
                message: isSmtpConfigured
                    ? 'สมัครสมาชิกสำเร็จ! กรุณายืนยันรหัส OTP ที่ส่งไปยังอีเมลของคุณ'
                    : 'สมัครสมาชิกสำเร็จ! กรุณายืนยันรหัส OTP',
                email: email,
                otp: isSmtpConfigured ? undefined : otpCode,
                emailSent: isSmtpConfigured
            });
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
            const token = jwt.sign({ userId, name: user.name, role: user.role,
                promptpay_number: user.promptpay_number,
                promptpay_name: user.promptpay_name }, jwtSecret, { expiresIn: '7d' });

            res.json({
                success: true,
                message: 'ยืนยันอีเมลและเข้าสู่ระบบสำเร็จ',
                token,
                user: { id: userId, user_id: userId, name: user.name, email: user.email, phone: user.phone, role: user.role }
            });
        });
    });
});

// 1.8 API ส่งรหัส OTP ใหม่อีกครั้ง (/api/resend-otp)
router.post('/resend-otp', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุอีเมล' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND auth_provider = "local"';
    db.query(sql, [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้นี้ในระบบ' });
        }

        const user = results[0];
        if (user.is_email_verified) {
            return res.status(400).json({ success: false, message: 'อีเมลนี้ได้รับการยืนยันแล้ว สามารถเข้าสู่ระบบได้ทันที' });
        }

        const otpCode = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        db.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE user_id = ?', [otpCode, otpExpiresAt, user.user_id], (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: 'สร้างรหัส OTP ใหม่ไม่สำเร็จ' });

            console.log(`\n=========================================`);
            console.log(`📧 ส่ง OTP ใหม่สำหรับอีเมล: ${email}`);
            console.log(`🔑 รหัส OTP ใหม่ของคุณคือ: ${otpCode}`);
            console.log(`=========================================\n`);

            // ส่งอีเมลจริงแบบ Non-blocking
            const isSmtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com');
            if (isSmtpConfigured) {
                transporter.sendMail({
                    from: `"ปันสุข (PanSuk)" <${process.env.SMTP_USER}>`,
                    to: email,
                    subject: 'รหัสยืนยันอีเมลของคุณ (OTP ใหม่)',
                    text: `สวัสดีคุณ ${user.name},\n\nรหัส OTP ใหม่สำหรับยืนยันอีเมลของคุณคือ: ${otpCode}\nรหัสมีอายุการใช้งาน 10 นาที\n\nขอบคุณที่เข้าร่วมกับเรา`
                }).then(() => {
                    console.log(`✅ ส่งอีเมล OTP ใหม่ไปยัง ${email} สำเร็จ!`);
                }).catch((mailErr) => {
                    console.warn('⚠️ ไม่สามารถส่งอีเมล OTP ใหม่ได้:', mailErr.message);
                });
            }

            res.json({
                success: true,
                message: isSmtpConfigured
                    ? 'ระบบได้ส่งรหัส OTP ใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว'
                    : 'สร้างรหัส OTP ใหม่เรียบร้อยแล้ว',
                email: email,
                otp: isSmtpConfigured ? undefined : otpCode,
                emailSent: isSmtpConfigured
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


// ลืมรหัสผ่าน (ของจริง)
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.query('SELECT user_id, name FROM users WHERE email = ? AND auth_provider = "local"', [email], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ' });
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบอีเมลนี้ในระบบ (หรือเป็นบัญชี Google)' });
        
        const user = rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 ชั่วโมง

        db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?', [resetToken, resetExpires, user.user_id], async (updateErr) => {
            if (updateErr) return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });

            const resetLink = `http://localhost:3000/?reset_token=${resetToken}`;
            
            try {
                if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com') {
                    await transporter.sendMail({
                        from: `"ปันสุข (PanSuk)" <${process.env.SMTP_USER}>`,
                        to: email,
                        subject: 'รีเซ็ตรหัสผ่านของคุณ',
                        text: `สวัสดีคุณ ${user.name},\n\nคลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):\n${resetLink}\n\nหากคุณไม่ได้ขอกู้คืนรหัสผ่าน กรุณาละเว้นอีเมลฉบับนี้`,
                        html: `<p>สวัสดีคุณ ${user.name},</p><p>คลิกที่ลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):</p><p><a href="${resetLink}">ตั้งรหัสผ่านใหม่</a></p><p>หากคุณไม่ได้ขอกู้คืนรหัสผ่าน กรุณาละเว้นอีเมลฉบับนี้</p>`
                    });
                } else {
                    console.log(`\n=========================================`);
                    console.log(`📧 จำลองการส่งลิงก์รีเซ็ตรหัสผ่านไปยัง: ${email}`);
                    console.log(`🔗 ลิงก์: ${resetLink}`);
                    console.log(`=========================================\n`);
                }
                res.json({ success: true, message: 'ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' });
            } catch (mailErr) {
                console.warn('⚠️ ส่งอีเมลไม่สำเร็จ:', mailErr.message);
                res.status(500).json({ success: false, message: 'ไม่สามารถส่งอีเมลได้ในขณะนี้' });
            }
        });
    });
});

// ตั้งรหัสผ่านใหม่
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });

    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
    if (newPassword.length < 6 || !specialCharRegex.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร และต้องมีตัวอักษรพิเศษอย่างน้อย 1 ตัว' });
    }

    db.query('SELECT user_id, reset_token_expires FROM users WHERE reset_token = ?', [token], async (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'ระบบขัดข้อง' });
        if (rows.length === 0) return res.status(400).json({ success: false, message: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง' });
        
        const user = rows[0];
        if (new Date(user.reset_token_expires) < new Date()) {
            return res.status(400).json({ success: false, message: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว' });
        }

        try {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?', [hashedPassword, user.user_id], (updateErr) => {
                if (updateErr) return res.status(500).json({ success: false, message: 'อัปเดตรหัสผ่านไม่สำเร็จ' });
                res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที' });
            });
        } catch (hashErr) {
            res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเข้ารหัสผ่าน' });
        }
    });
});

module.exports = router;
