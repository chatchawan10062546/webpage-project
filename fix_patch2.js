const fs = require('fs');
let content = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const regex = /if \(status === 'accepted'\) \{[\s\n]*\/\/ 🌟 ให้ XP แก่ผู้แจก\/ผู้ขาย \(\+50 สำหรับแจกฟรี, \+20 สำหรับขาย\/เช่า\)/m;
const replacement = `if (status === 'accepted') {
            // --- 🔔 แจ้งเตือนผู้ขอรับ ---
            db.query('SELECT r.requester_id, i.title FROM item_requests r JOIN items i ON r.item_id = i.item_id WHERE r.request_id = ?', [requestId], (err, notifRows) => {
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

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('routes/itemRoutes.js', content, 'utf8');
    console.log("Successfully fixed the PATCH notification bug!");
} else {
    console.log("Regex didn't match.");
}
