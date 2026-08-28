// ====================================================
// ⚙️ config/db.js : ไฟล์จัดการเชื่อมต่อฐานข้อมูล MySQL
// ====================================================
const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',        // รหัสผ่าน XAMPP (ถ้าไม่มีเว้นว่างไว้)
    database: 'pankan_db', // ชื่อฐานข้อมูลใน phpMyAdmin
    port: 3307,          // 👈 ใส่ Port 3307 ตรงนี้ครับ!
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบการเชื่อมต่อ
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
    } else {
        console.log('✅ เชื่อมต่อ MySQL ฐานข้อมูล (share_db) ผ่าน Port 3307 สำเร็จ!');
        connection.release();
    }
});

module.exports = db;