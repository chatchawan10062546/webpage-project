// ====================================================
// 💬 chatRoutes.js : API ห้องแชตและข้อความ
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

function hasRoomAccess(roomId, userId, callback) {
   db.query(
      'SELECT room_id FROM chat_room_members WHERE room_id = ? AND user_id = ?',
      [roomId, userId],
      (err, rows) => callback(err, rows.length > 0)
   );
}

// ดึงห้องแชตทั้งหมดของผู้ใช้ พร้อมชื่อสินค้าและข้อความล่าสุด
router.get('/chat/rooms', requireAuth, (req, res) => {
   const user_id = req.authUser.userId;
   if (!user_id) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   const sql = `
            SELECT r.id AS room_id, r.item_id, COALESCE(i.title, r.name) AS item_title,
               i.image_url AS item_image,
             other.user_id AS other_user_id, COALESCE(other_user.name, 'ผู้ใช้') AS other_user_name,
             latest.message AS latest_message, latest.created_at AS latest_created_at
      FROM chat_rooms r
      JOIN chat_room_members mine ON mine.room_id = r.id AND mine.user_id = ?
      LEFT JOIN items i ON i.item_id = r.item_id
      LEFT JOIN chat_room_members other ON other.room_id = r.id AND other.user_id <> ?
      LEFT JOIN users other_user ON other_user.user_id = other.user_id
      LEFT JOIN chat_messages latest ON latest.id = (
         SELECT m.id FROM chat_messages m WHERE m.room_id = r.id ORDER BY m.id DESC LIMIT 1
      )
      ORDER BY latest.created_at DESC, r.id DESC
   `;
   db.query(sql, [user_id, user_id], (err, rooms) => {
      if (err) {
         console.error('Fetch Chat Rooms Error:', err);
         return res.status(500).json({ success: false, message: 'ดึงห้องแชตไม่สำเร็จ' });
      }
      res.json({ success: true, rooms });
   });
});

// สร้างห้องหรือใช้ห้องเดิมระหว่างผู้ใช้สองคน
router.post('/chat/rooms', requireAuth, (req, res) => {
   const { other_user_id, item_id, name } = req.body;
   const user_id = req.authUser.userId;
   if (!user_id || !other_user_id || !item_id || String(user_id) === String(other_user_id)) {
      return res.status(400).json({ success: false, message: 'ผู้ใช้ห้องแชตไม่ถูกต้อง' });
   }

   const roomName = name || `ห้องสนทนา ${user_id}-${other_user_id}`;
   const findSql = `
      SELECT r.id FROM chat_rooms r
      JOIN chat_room_members m1 ON m1.room_id = r.id AND m1.user_id = ?
      JOIN chat_room_members m2 ON m2.room_id = r.id AND m2.user_id = ?
      WHERE r.item_id = ?
      LIMIT 1
   `;
   db.query(findSql, [user_id, other_user_id, item_id], (findErr, rooms) => {
      if (findErr) return res.status(500).json({ success: false, message: 'ค้นหาห้องแชตไม่สำเร็จ' });
      if (rooms.length > 0) return res.json({ success: true, room_id: rooms[0].id });

      db.query('INSERT INTO chat_rooms (name, item_id) VALUES (?, ?)', [roomName, item_id], (roomErr, result) => {
         if (roomErr) return res.status(500).json({ success: false, message: 'สร้างห้องแชตไม่สำเร็จ' });
         const roomId = result.insertId;
         db.query(
            'INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?), (?, ?)',
            [roomId, user_id, roomId, other_user_id],
            memberErr => {
               if (memberErr) return res.status(500).json({ success: false, message: 'เพิ่มสมาชิกห้องไม่สำเร็จ' });
               res.json({ success: true, room_id: roomId });
            }
         );
      });
   });
});

// อ่านข้อความในห้องที่ผู้ใช้เป็นสมาชิก
router.get('/chat/rooms/:roomId/messages', requireAuth, (req, res) => {
   const { roomId } = req.params;
   const user_id = req.authUser.userId;
   if (!user_id) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   hasRoomAccess(roomId, user_id, (accessErr, allowed) => {
      if (accessErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
      if (!allowed) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าห้องนี้' });
      db.query(
         'SELECT id, room_id, user_id, user_name, message, created_at FROM chat_messages WHERE room_id = ? ORDER BY id ASC',
         [roomId],
         (err, messages) => {
            if (err) return res.status(500).json({ success: false, message: 'ดึงข้อความไม่สำเร็จ' });
            res.json({ success: true, messages });
         }
      );
   });
});

// ส่งข้อความในห้องที่ผู้ใช้เป็นสมาชิก
router.post('/chat/rooms/:roomId/messages', requireAuth, (req, res) => {
   const { roomId } = req.params;
   const { message } = req.body;
   const user_id = req.authUser.userId;
   const user_name = req.authUser.name;
   if (!user_id || !user_name || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'ข้อความไม่ถูกต้อง' });
   }

   hasRoomAccess(roomId, user_id, (accessErr, allowed) => {
      if (accessErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสิทธิ์ไม่สำเร็จ' });
      if (!allowed) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์เข้าห้องนี้' });
      db.query(
         'INSERT INTO chat_messages (room_id, user_id, user_name, message) VALUES (?, ?, ?, ?)',
         [roomId, user_id, user_name, message.trim()],
         (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'ส่งข้อความไม่สำเร็จ' });
            res.json({ success: true, message_id: result.insertId });
         }
      );
   });
});

// อ่านข้อความทั้งหมดของสินค้าที่ผู้ใช้เป็นเจ้าของ
router.get('/chat/items/:itemId/messages', requireAuth, (req, res) => {
   const { itemId } = req.params;
   const user_id = req.authUser.userId;
   if (!user_id) return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ใช้' });

   const sql = `
            SELECT m.id, m.room_id, m.user_id,
               CONVERT(m.user_name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS user_name,
               CONVERT(m.message USING utf8mb4) COLLATE utf8mb4_unicode_ci AS message,
               m.created_at, 'chat' COLLATE utf8mb4_unicode_ci AS message_type
      FROM chat_messages m
      JOIN chat_rooms r ON r.id = m.room_id AND r.item_id = ?
      JOIN items i ON i.item_id = r.item_id AND i.user_id = ?
      UNION ALL
            SELECT q.request_id AS id, NULL AS room_id, q.requester_id AS user_id,
               CONVERT(u.name USING utf8mb4) COLLATE utf8mb4_unicode_ci AS user_name,
               CONVERT(q.message USING utf8mb4) COLLATE utf8mb4_unicode_ci AS message,
               q.created_at, 'request' COLLATE utf8mb4_unicode_ci AS message_type
      FROM item_requests q
      JOIN items i ON i.item_id = q.item_id AND i.user_id = ?
      JOIN users u ON u.user_id = q.requester_id
      WHERE q.item_id = ? AND q.message IS NOT NULL AND q.message <> ''
      ORDER BY created_at ASC
   `;
   db.query(sql, [itemId, user_id, user_id, itemId], (err, messages) => {
      if (err) {
         console.error('Fetch Item Messages Error:', err);
         return res.status(500).json({ success: false, message: 'ดึงข้อความสินค้าไม่สำเร็จ' });
      }
      res.json({ success: true, messages });
   });
});

module.exports = router;
