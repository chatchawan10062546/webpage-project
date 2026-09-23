const fs = require('fs');
let content = fs.readFileSync('routes/itemRoutes.js', 'utf8');

// We need to rewrite the POST /items/:itemId/requests endpoint manually to fix it.
const searchStr = `router.post('/items/:itemId/requests', requireAuth, (req, res) => {
   const { message } = req.body;
   const requester_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!requester_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ขอรับของ' });
   }

   db.query('SELECT item_id, user_id, status FROM items WHERE item_id = ?', [itemId], (itemErr, items) => {`;

const replaceStr = `router.post('/items/:itemId/requests', requireAuth, (req, res) => {
   const { message } = req.body;
   const requester_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!requester_id) {
      return res.status(400).json({ success: false, message: 'ไม่พบรหัสผู้ขอรับของ' });
   }

   db.query('SELECT item_id, user_id, status, title FROM items WHERE item_id = ?', [itemId], (itemErr, items) => {`;

content = content.replace(searchStr, replaceStr);
// Then fix the insert callback and notification logic.
const fixCallbackSearch = `      db.query(
         'INSERT INTO item_requests (item_id, requester_id, message) VALUES (?, ?, ?)',
         [itemId, requester_id, message || ''],
         (err) => {
            if (err) {
               if (err.code === 'ER_DUP_ENTRY') {
                  return res.status(409).json({ success: false, message: 'คุณเคยส่งคำขอรายการนี้แล้ว' });
               }
               console.error('Create Item Request Error:', err);
               return res.status(500).json({ success: false, message: 'ส่งคำขอไม่สำเร็จ' });
            }
            
               // --- 🔔 แจ้งเตือนเจ้าของของ ---
               const notifMsg = \`มีผู้ใช้สนใจขอรับ "\${titleMatch}" ของคุณ\`;
               db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)', 
                        [ownerId, requester_id, 'request_received', insertResult.insertId, notifMsg]);
               // -------------------------------
               res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });
         }
      );`;

const fixCallbackReplace = `      db.query(
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
                if (notifErr) console.error("Notification Insert Error:", notifErr);
                res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });
            });
         }
      );`;

content = content.replace(fixCallbackSearch, fixCallbackReplace);
fs.writeFileSync('routes/itemRoutes.js', content, 'utf8');
console.log("Fixed POST /items/:itemId/requests");
