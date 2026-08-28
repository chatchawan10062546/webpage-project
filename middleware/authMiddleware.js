// ====================================================
// 🔐 authMiddleware.js : ตรวจสอบ JWT ก่อนเข้า API ที่ต้องล็อกอิน
// ====================================================
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'pankan-development-secret-change-before-production';

function requireAuth(req, res, next) {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน' });
    }

    try {
        req.authUser = jwt.verify(token, jwtSecret);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'เซสชันหมดอายุหรือไม่ถูกต้อง' });
    }
}

module.exports = { jwtSecret, requireAuth };
