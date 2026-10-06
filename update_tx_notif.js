const fs = require('fs');
let c = fs.readFileSync('routes/transactionRoutes.js', 'utf8');

if (!c.includes('notificationHelper')) {
    c = c.replace("const db = require('../config/db');", "const db = require('../config/db');\nconst { createNotification } = require('../utils/notificationHelper');");
}

// Pay
c = c.replace(
    "res.json({ success: true, message: 'ชำระเงินและพักยอดเงินสำเร็จ' });",
    "createNotification(transaction.giver_id, buyerId, 'transaction_update', transactionId, `มีผู้ชำระเงินสำหรับสินค้าของคุณแล้ว กรุณาจัดส่งสินค้า`).catch(console.error);\n           res.json({ success: true, message: 'ชำระเงินและพักยอดเงินสำเร็จ' });"
);

// Ship
c = c.replace(
    "res.json({ success: true, message: 'แจ้งจัดส่งสินค้าสำเร็จ' });",
    "createNotification(transaction.receiver_id, req.authUser.userId, 'transaction_update', transactionId, `ผู้ขายได้จัดส่งสินค้าแล้ว (เลขพัสดุ: ${tracking_number || '-'}) ตรวจสอบและกดยืนยันเมื่อได้รับของ`).catch(console.error);\n           res.json({ success: true, message: 'แจ้งจัดส่งสินค้าสำเร็จ' });"
);

// Confirm
c = c.replace(
    "res.json({ success: true, message: 'ยืนยันการรับสินค้าสำเร็จ' });",
    "createNotification(transaction.giver_id, req.authUser.userId, 'transaction_update', transactionId, `ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินตรวจสอบและโอนเงินให้คุณ`).catch(console.error);\n           res.json({ success: true, message: 'ยืนยันการรับสินค้าสำเร็จ' });"
);

fs.writeFileSync('routes/transactionRoutes.js', c, 'utf8');
console.log('Updated transactionRoutes with notifications');
