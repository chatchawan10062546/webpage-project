const fs = require('fs');
let lines = fs.readFileSync('routes/transactionRoutes.js', 'utf8').split('\n');
// We need to replace lines 156 to 176
let replacement = `             if (typeof createNotification === 'function') {
                 createNotification(giverId, buyerId, 'transaction_update', transactionId, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ').catch(console.error);
             }
             db.query(
                "UPDATE items i JOIN transactions t ON t.item_id = i.item_id SET i.status = 'completed' WHERE t.trans_id = ?",
                [transactionId],
                itemErr => {
                   if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะสินค้าไม่สำเร็จ' });
                   res.json({ success: true, message: 'ยืนยันรับสินค้าแล้ว ระบบปล่อยเงินให้คนขายแล้ว' });
                }
             );
          }
       );
   });
});`;
lines.splice(155, 22, replacement);
fs.writeFileSync('routes/transactionRoutes.js', lines.join('\n'));
console.log('Fixed');
