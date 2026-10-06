const fs = require('fs');
let code = fs.readFileSync('routes/authRoutes.js', 'utf8');

const forgotRoute = `
// ลืมรหัสผ่าน (Mock)
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    db.query('SELECT user_id FROM users WHERE email = ?', [email], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดของระบบ' });
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบอีเมลนี้ในระบบ' });
        
        // ในระบบจริง ควรจะบันทึก token ลง DB และส่งอีเมลผ่าน Nodemailer
        res.json({ success: true, message: 'ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว (จำลอง)' });
    });
});

module.exports = router;
`;

code = code.replace(/module\.exports = router;/, forgotRoute);
fs.writeFileSync('routes/authRoutes.js', code);
console.log('Added forgot-password route');
