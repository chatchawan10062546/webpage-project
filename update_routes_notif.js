const fs = require('fs');
let c = fs.readFileSync('routes/transactionRoutes.js', 'utf8');

c = c.replace(
/router\.post\('\/transactions\/:transactionId\/pay', requireAuth, \(req, res\) => \{[\s\S]*?\}\);/g,
`router.post('/transactions/:transactionId/pay', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const buyerId = req.authUser.userId;
   db.query('SELECT giver_id FROM transactions WHERE trans_id = ?', [transactionId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
       const giverId = rows[0].giver_id;
       db.query(
          \`UPDATE transactions
           SET status = 'paid', payment_status = 'held', paid_at = CURRENT_TIMESTAMP
           WHERE trans_id = ? AND receiver_id = ? AND status = 'awaiting_payment'\`,
          [transactionId, buyerId],
          (err, result) => {
             if (err) return res.status(500).json({ success: false, message: 'ชำระเงินไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมชำระเงิน' });
             db.query(
                \`UPDATE items i JOIN transactions t ON t.item_id = i.item_id
                 SET i.status = 'reserved' WHERE t.trans_id = ?\`,
                [transactionId],
                itemErr => {
                   if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะสินค้าไม่สำเร็จ' });
                   if (typeof createNotification === 'function') {
                       createNotification(giverId, buyerId, 'transaction_update', transactionId, 'มีผู้ชำระเงินสำหรับสินค้าของคุณแล้ว กรุณาจัดส่งสินค้า').catch(console.error);
                   }
                   res.json({ success: true, message: 'ชำระเงินสำเร็จ เงินถูกพักไว้ในระบบกลาง' });
                }
             );
          }
       );
   });
});`
);

c = c.replace(
/router\.patch\('\/transactions\/:transactionId\/ship', requireAuth, \(req, res\) => \{[\s\S]*?\}\);/g,
`router.patch('/transactions/:transactionId/ship', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const { tracking_number } = req.body;
   const sellerId = req.authUser.userId;
   db.query('SELECT receiver_id FROM transactions WHERE trans_id = ?', [transactionId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
       const receiverId = rows[0].receiver_id;
       db.query(
          \`UPDATE transactions
           SET status = 'shipped', shipping_status = 'shipped', tracking_number = ?,
               shipped_at = CURRENT_TIMESTAMP, release_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
           WHERE trans_id = ? AND giver_id = ? AND status = 'paid' AND payment_status = 'held'\`,
          [tracking_number || null, transactionId, sellerId],
          (err, result) => {
             if (err) return res.status(500).json({ success: false, message: 'แจ้งส่งสินค้าไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมจัดส่ง' });
             if (typeof createNotification === 'function') {
                 createNotification(receiverId, sellerId, 'transaction_update', transactionId, \`ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: \${tracking_number || '-'}) ตรวจสอบและกดยืนยันเมื่อได้รับของ\`).catch(console.error);
             }
             res.json({ success: true, message: 'แจ้งจัดส่งสินค้าสำเร็จ' });
          }
       );
   });
});`
);

c = c.replace(
/router\.post\('\/transactions\/:transactionId\/confirm', requireAuth, \(req, res\) => \{[\s\S]*?\}\);/g,
`router.post('/transactions/:transactionId/confirm', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const buyerId = req.authUser.userId;
   db.query('SELECT giver_id FROM transactions WHERE trans_id = ?', [transactionId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
       const giverId = rows[0].giver_id;
       db.query(
          \`UPDATE transactions
           SET status = 'released', payment_status = 'released', shipping_status = 'delivered', released_at = CURRENT_TIMESTAMP
           WHERE trans_id = ? AND receiver_id = ? AND (status = 'shipped' OR status = 'paid') AND payment_status = 'held'\`,
          [transactionId, buyerId],
          (err, result) => {
             if (err) return res.status(500).json({ success: false, message: 'ยืนยันการรับสินค้าไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมยืนยัน' });
             if (typeof createNotification === 'function') {
                 createNotification(giverId, buyerId, 'transaction_update', transactionId, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ').catch(console.error);
             }
             res.json({ success: true, message: 'ยืนยันการรับสินค้าสำเร็จ' });
          }
       );
   });
});`
);

fs.writeFileSync('routes/transactionRoutes.js', c, 'utf8');
console.log('Replaced route implementations');
