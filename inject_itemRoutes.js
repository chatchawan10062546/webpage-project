const fs = require('fs');
let itemRoutes = fs.readFileSync('routes/itemRoutes.js', 'utf8');

// Injection 1: Insert notification on new request
const search1 = "db.query('INSERT INTO item_requests (item_id, requester_id, message) VALUES (?, ?, ?)',";
const replace1 = `const titleMatch = items[0].title;
         const ownerId = items[0].user_id;
         db.query('INSERT INTO item_requests (item_id, requester_id, message) VALUES (?, ?, ?)',`;
const injectAfter1 = `res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });`;
const injectAfterContent1 = `
               // --- 🔔 แจ้งเตือนเจ้าของของ ---
               const notifMsg = \`มีผู้ใช้สนใจขอรับ "\${titleMatch}" ของคุณ\`;
               db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)', 
                        [ownerId, requester_id, 'request_received', insertResult.insertId, notifMsg]);
               // -------------------------------
               res.json({ success: true, message: 'ส่งคำขอรับของสำเร็จ' });`;

if (!itemRoutes.includes("type, reference_id, message) VALUES")) {
    itemRoutes = itemRoutes.replace(search1, replace1);
    itemRoutes = itemRoutes.replace(injectAfter1, injectAfterContent1);
}

// Injection 2: Insert notification on accepted
const search2 = "if (status === 'accepted') {";
const replace2 = `if (status === 'accepted') {
         // --- 🔔 แจ้งเตือนผู้ขอรับ ---
         db.query('SELECT requester_id, i.title FROM item_requests r JOIN items i ON r.item_id = i.item_id WHERE r.request_id = ?', [requestId], (err, notifRows) => {
             if(!err && notifRows.length > 0) {
                 const reqUserId = notifRows[0].requester_id;
                 const reqItemTitle = notifRows[0].title;
                 const notifMsg = \`คำขอรับของ "\${reqItemTitle}" ของคุณได้รับการอนุมัติแล้ว\`;
                 db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)',
                          [reqUserId, user_id, 'request_accepted', requestId, notifMsg]);
             }
         });
         // -------------------------------
`;
if (!itemRoutes.includes("type, reference_id, message) VALUES (?, ?, ?, ?, ?)")) {
    itemRoutes = itemRoutes.replace(search2, replace2);
}

fs.writeFileSync('routes/itemRoutes.js', itemRoutes, 'utf8');
console.log("Injected notifications into itemRoutes.js");
