// ====================================================
// ⚙️ config/db.js : ไฟล์จัดการเชื่อมต่อฐานข้อมูล MySQL
// ====================================================
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pankan_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบการเชื่อมต่อ
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ เชื่อมต่อ MySQL ไม่สำเร็จ:', err.message);
    } else {
        console.log(`✅ เชื่อมต่อ MySQL ฐานข้อมูล (${process.env.DB_NAME || 'pankan_db'}) ผ่าน Port ${process.env.DB_PORT || 3306} สำเร็จ!`);
        connection.release();
    }
});

module.exports = db;