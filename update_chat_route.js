const fs = require('fs');
let c = fs.readFileSync('routes/chatRoutes.js', 'utf8');

if (!c.includes("const multer = require('multer');")) {
    c = c.replace("const express = require('express');", "const express = require('express');\nconst multer = require('multer');\nconst path = require('path');\nconst storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, Date.now() + '-chat-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname)) });\nconst upload = multer({ storage: storage });");
}

const oldPost = `router.post('/chat/rooms/:roomId/messages', requireAuth, (req, res) => {
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
});`;

const newPost = `router.post('/chat/rooms/:roomId/messages', requireAuth, upload.single('image'), (req, res) => {
   const { roomId } = req.params;
   let { message } = req.body;
   const user_id = req.authUser.userId;
   const user_name = req.authUser.name;
   
   if (req.file) {
      message = '[IMAGE]/uploads/' + req.file.filename;
   }
   
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
            res.json({ success: true, message_id: result.insertId, message: message.trim() });
         }
      );
   });
});`;

c = c.replace(oldPost, newPost);
fs.writeFileSync('routes/chatRoutes.js', c, 'utf8');
console.log('Added multer and modified chat message post route');
