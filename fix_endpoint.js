const fs = require('fs');
let text = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const regex = /router\.post\('\/items\/:itemId\/requests'[\s\S]*?(?=\n\/\/ 📌 6\. API)/;

const newEndpoint = `router.post('/items/:itemId/requests', requireAuth, (req, res) => {
   const { message } = req.body;
   const requester_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!requester_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ขอรับของ' });
   }

   db.query('SELECT item_id, user_id, status, title FROM items WHERE item_id = ?', [itemId], (itemErr, items) => {
      if (itemErr) return res.status(500).json({ success: false, message: 'ตรวจสอบรายการไม่สำเร็จ' });
      if (items.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายการนี้' });
      if (String(items[0].user_id) === String(requester_id)) {
         return res.status(400).json({ success: false, message: 'ไม่สามารถขอรับรายการของตัวเองได้' });
      }
      if (items[0].status !== 'available') {
         return res.status(400).json({ success: false, message: 'รายการนี้ไม่พร้อมให้ขอรับแล้ว' });
      }

      db.query(
         'INSERT INTO item_requests (item_id, requester_id, message) VALUES (?, ?, ?)',
         [itemId, requester_id, message || ''],
         (err, insertResult) => {
            if (err) {
               if (err.code === 'ER_DUP_ENTRY') {
                  return res.status(409).json({ success: false, message: 'คุณเคยส่งคำขอรายการนี้แล้ว' });
               }
               console.error('Create Item Request Error:', err);
               return res.status(500).json({ success: false, message: 'ส่งคำขอไม่สำเร็จ' });
            }
            
            // --- 🔔 แจ้งเตือนเจ้าของของ ---
            const titleMatch = items[0].title;
            const ownerId = items[0].user_id;
            const notifMsg = \`มีผู้ใช้สนใจขอรับ "\${titleMatch}" ของคุณ\`;
            db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)', 
                     [ownerId, requester_id, 'request_received', insertResult.insertId, notifMsg], (notifErr) => {
                if(notifErr) console.error(notifErr);
            });
            // -------------------------------
            res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });
         }
      );
   });
});
`;

text = text.replace(regex, newEndpoint);
fs.writeFileSync('routes/itemRoutes.js', text, 'utf8');
console.log('Successfully replaced the endpoint.');
