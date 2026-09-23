const fs = require('fs');
let content = fs.readFileSync('routes/itemRoutes.js', 'utf8');

// Fix the PATCH notification
const patchSearch = `         if (status === 'accepted') {
            // 🌟 ให้ XP แก่ผู้แจก/ผู้ขาย (+50 สำหรับแจกฟรี, +20 สำหรับขาย/เช่า)`;
            
const patchReplace = `         if (status === 'accepted') {
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
            
            // 🌟 ให้ XP แก่ผู้แจก/ผู้ขาย (+50 สำหรับแจกฟรี, +20 สำหรับขาย/เช่า)`;

if (!content.includes('request_accepted')) {
    content = content.replace(patchSearch, patchReplace);
    fs.writeFileSync('routes/itemRoutes.js', content, 'utf8');
    console.log('Fixed PATCH');
} else {
    console.log('PATCH already has request_accepted');
}
