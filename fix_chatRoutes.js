const fs = require('fs');
let c = fs.readFileSync('routes/chatRoutes.js', 'utf8');

const regex = /router\.post\('\/chat\/rooms\/:roomId\/messages', requireAuth, \(req, res\) => \{[\s\S]*?\}\);/;
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

c = c.replace(regex, newPost);
fs.writeFileSync('routes/chatRoutes.js', c, 'utf8');
console.log('Fixed chatRoutes');
