// ====================================================
// 🚀 server.js : ไฟล์ตัวรันหลักของ Node.js Server
// ====================================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// ดึงตัวจัดการ Socket.io
const { setIO, emitToUser, emitToRoom } = require('./utils/socketHelper');

// ดึงไฟล์ Routes ที่เราแยกไว้มาใช้งาน
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const chatRoutes = require('./routes/chatRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// บันทึก io instance สำหรับให้โมดูลอื่นเรียกใช้งาน
setIO(io);

// ⚡ จัดการการเชื่อมต่อ WebSocket ของผู้ใช้
io.on('connection', (socket) => {
    // ผู้ใช้เข้าห้องส่วนตัวสำหรับรับการแจ้งเตือน
    socket.on('join_user', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
        }
    });

    // ผู้ใช้เข้าห้องแชตเพื่อรับข้อความสด
    socket.on('join_room', (roomId) => {
        if (roomId) {
            socket.join(`room_${roomId}`);
        }
    });

    // ผู้ใช้ออกจากห้องแชต
    socket.on('leave_room', (roomId) => {
        if (roomId) {
            socket.leave(`room_${roomId}`);
        }
    });
});

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
app.set('trust proxy', true);

// 1. อนุญาตให้ Frontend เรียกใช้งาน API ได้
app.use(cors());

// 📍 API ค้นหาพิกัดเริ่มต้นจาก IP Address เน็ตมือถือ/บ้าน (เพื่อให้คนต่างจังหวัดเปิดแผนที่ตรงอำเภอ/จังหวัดตัวเองทันที)
const ipLocationCache = new Map();

app.get('/api/ip-location', async (req, res) => {
    try {
        let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || '';
        if (clientIp.includes(',')) {
            clientIp = clientIp.split(',')[0].trim();
        }
        if (clientIp.startsWith('::ffff:')) {
            clientIp = clientIp.replace('::ffff:', '');
        }

        const isPrivate = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.');
        const targetIp = isPrivate ? '' : clientIp;

        if (targetIp && ipLocationCache.has(targetIp)) {
            return res.json(ipLocationCache.get(targetIp));
        }

        const url = targetIp 
            ? `http://ip-api.com/json/${targetIp}?fields=status,message,country,regionName,city,lat,lon`
            : `http://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        const data = await response.json();
        if (data && data.status === 'success' && Number.isFinite(data.lat) && Number.isFinite(data.lon)) {
            const result = {
                success: true,
                city: data.city || data.regionName,
                regionName: data.regionName,
                country: data.country,
                lat: data.lat,
                lon: data.lon,
                isDefault: false
            };
            if (targetIp) {
                ipLocationCache.set(targetIp, result);
                if (ipLocationCache.size > 1000) {
                    const firstKey = ipLocationCache.keys().next().value;
                    ipLocationCache.delete(firstKey);
                }
            }
            return res.json(result);
        }

        return res.json({
            success: true,
            city: 'Bangkok',
            regionName: 'Bangkok',
            lat: 13.7563,
            lon: 100.5018,
            isDefault: true
        });
    } catch (err) {
        return res.json({
            success: true,
            city: 'Bangkok',
            regionName: 'Bangkok',
            lat: 13.7563,
            lon: 100.5018,
            isDefault: true
        });
    }
});

// 2. แปลงข้อมูล Request body ที่ส่งเข้ามาเป็น JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. เปิดให้เบราว์เซอร์เข้าถึงรูปภาพในโฟลเดอร์ 'uploads' ได้
app.use('/uploads', express.static(uploadDir));

// 4. เปิดให้เบราว์เซอร์เข้าถึงไฟล์หน้าเว็บ (HTML/CSS/JS) ทั้งหมดผ่าน localhost ได้
app.use(express.static(__dirname));

// ส่งคืนไฟล์ webpage.html เมื่อเข้าใช้งานหน้าหลัก (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'webpage.html'));
});

// ----------------------------------------------------
// 📌 API Routes
// ----------------------------------------------------
app.use('/api', authRoutes); // เรียกใช้งาน /api/register และ /api/login
app.use('/api', itemRoutes); // เรียกใช้งาน /api/items
app.use('/api', chatRoutes); // เรียกใช้งานระบบแชต
app.use('/api', profileRoutes); // เรียกใช้งานระบบโปรไฟล์
app.use('/api', transactionRoutes); // เรียกใช้งานระบบธุรกรรมคนกลาง
app.use('/api', reportRoutes);
app.use('/api', notificationRoutes); // เรียกใช้งานระบบแจ้งปัญหา
app.use('/api', adminRoutes); // เรียกใช้งานระบบหลังบ้านแอดมิน
app.use('/api', reviewRoutes); // เรียกใช้งานระบบรีวิวและเลเวล
 
// ⚡ Endpoint ทดสอบ Real-Time Event สำหรับ Developer
app.post('/api/test-realtime-trigger', (req, res) => {
    const { userId, roomId, type, message } = req.body;
    if (type === 'notification' && userId) {
        emitToUser(userId, 'new_notification', {
            notif_id: Date.now(),
            user_id: userId,
            message: message || 'ทดสอบการแจ้งเตือน Real-Time สำเร็จ!',
            created_at: new Date()
        });
        return res.json({ success: true, message: 'Notification emitted' });
    }
    if (type === 'chat' && roomId) {
        emitToRoom(roomId, 'new_chat_message', {
            id: Date.now(),
            room_id: Number(roomId),
            user_id: userId || 999,
            user_name: 'ผู้ทดสอบ',
            message: message || 'ทดสอบแชต Real-Time สำเร็จ!',
            created_at: new Date()
        });
        return res.json({ success: true, message: 'Chat message emitted' });
    }
    res.status(400).json({ success: false, message: 'Invalid test payload' });
});

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
// 🚀 สั่งรัน Server (ใช้ server.listen เพื่อรองรับ WebSocket)
// ----------------------------------------------------
server.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running with Socket.io on http://localhost:${PORT}`);
    console.log(`=================================`);
});