// ====================================================
// 🚀 server.js : ไฟล์ตัวรันหลักของ Node.js Server
// ====================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ดึงไฟล์ Routes ที่เราแยกไว้มาใช้งาน
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// 📁 ตรวจสอบและสร้างโฟลเดอร์ uploads อัตโนมัติ
// ----------------------------------------------------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('📁 Created "uploads" directory successfully.');
}

// ----------------------------------------------------
// ⚙️ Middlewares
// ----------------------------------------------------
// 1. อนุญาตให้ Frontend เรียกใช้งาน API ได้
app.use(cors());

// 2. แปลงข้อมูล Request body ที่ส่งเข้ามาเป็น JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. เปิดให้เบราว์เซอร์เข้าถึงรูปภาพในโฟลเดอร์ 'uploads' ได้
app.use('/uploads', express.static(uploadDir));

// ----------------------------------------------------
// 📌 API Routes
// ----------------------------------------------------
app.use('/api', authRoutes); // เรียกใช้งาน /api/register และ /api/login
app.use('/api', itemRoutes); // เรียกใช้งาน /api/items

// ----------------------------------------------------
// ❓ Handle 404 Not Found (กรณีเรียก Route ที่ไม่มีอยู่จริง)
// ----------------------------------------------------
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบ Endpoint หรือ URL ที่ระบุ'
    });
});

// ----------------------------------------------------
// 🛡️ Error Handling Middleware (ดักจับ Error ฝั่ง Server)
// ----------------------------------------------------
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' 
    });
});

// ----------------------------------------------------
// 🚀 สั่งรัน Server
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`=================================`);
});