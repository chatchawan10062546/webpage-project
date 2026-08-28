// ====================================================
// 💳 transactionRoutes.js : API ธุรกรรมคนกลาง (โหมดทดสอบ)
// ====================================================
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/transactions', requireAuth, (req, res) => {
   const { item_id } = req.body;
   const buyerId = req.authUser.userId;

   if (!item_id) return res.status(400).json({ success: false, message: 'ไม่พบรายการสินค้า' });

   db.query(
      'SELECT item_id, user_id, item_type, price, status FROM items WHERE item_id = ?',
      [item_id],
      (itemErr, items) => {
         if (itemErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสินค้าไม่สำเร็จ' });
         if (items.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบสินค้านี้' });

         const item = items[0];
         if (String(item.user_id) === String(buyerId)) {
            return res.status(400).json({ success: false, message: 'ไม่สามารถซื้อสินค้าของตัวเองได้' });
         }
         if (item.item_type === 'free') {
            return res.status(400).json({ success: false, message: 'สินค้าฟรีไม่ต้องใช้ระบบคนกลาง' });
         }
         if (item.status !== 'available') {
            return res.status(409).json({ success: false, message: 'สินค้านี้ไม่พร้อมให้ซื้อแล้ว' });
         }

         db.query(
            `SELECT trans_id FROM transactions
             WHERE item_id = ? AND receiver_id = ?
               AND status NOT IN ('cancelled', 'refunded')
             LIMIT 1`,
            [item_id, buyerId],
            (existingErr, existing) => {
               if (existingErr) return res.status(500).json({ success: false, message: 'ตรวจสอบธุรกรรมไม่สำเร็จ' });
               if (existing.length > 0) {
                  return res.json({ success: true, transaction_id: existing[0].trans_id, existing: true });
               }

               db.query(
                  `INSERT INTO transactions
                   (item_id, giver_id, receiver_id, amount, status, payment_status, shipping_status)
                   VALUES (?, ?, ?, ?, 'awaiting_payment', 'pending', 'pending')`,
                  [item_id, item.user_id, buyerId, item.price || 0],
                  (insertErr, result) => {
                     if (insertErr) {
                        console.error('Create Transaction Error:', insertErr);
                        return res.status(500).json({ success: false, message: 'สร้างธุรกรรมไม่สำเร็จ' });
                     }
                     res.json({ success: true, transaction_id: result.insertId, amount: item.price || 0 });
                  }
               );
            }
         );
      }
   );
});

router.get('/transactions/:transactionId', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const userId = req.authUser.userId;
   const sql = `
      SELECT t.*, i.title, i.image_url, g.name AS giver_name, r.name AS receiver_name
      FROM transactions t
      JOIN items i ON i.item_id = t.item_id
      JOIN users g ON g.user_id = t.giver_id
      JOIN users r ON r.user_id = t.receiver_id
      WHERE t.trans_id = ? AND (t.giver_id = ? OR t.receiver_id = ?)
   `;
   db.query(sql, [transactionId, userId, userId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, message: 'ดึงธุรกรรมไม่สำเร็จ' });
      if (rows.length === 0) return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดูธุรกรรมนี้' });
      res.json({ success: true, transaction: rows[0] });
   });
});

// โหมดทดสอบ: จำลองการชำระเงินและพักเงินไว้ในระบบ
router.post('/transactions/:transactionId/pay', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const buyerId = req.authUser.userId;
   db.query(
      `UPDATE transactions
       SET status = 'paid', payment_status = 'held', paid_at = CURRENT_TIMESTAMP
       WHERE trans_id = ? AND receiver_id = ? AND status = 'awaiting_payment'`,
      [transactionId, buyerId],
      (err, result) => {
         if (err) return res.status(500).json({ success: false, message: 'ชำระเงินไม่สำเร็จ' });
         if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมชำระเงิน' });
         db.query(
            `UPDATE items i JOIN transactions t ON t.item_id = i.item_id
             SET i.status = 'reserved' WHERE t.trans_id = ?`,
            [transactionId],
            itemErr => {
               if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะสินค้าไม่สำเร็จ' });
               res.json({ success: true, message: 'ชำระเงินสำเร็จ เงินถูกพักไว้ในระบบกลาง' });
            }
         );
      }
   );
});

// คนขายแจ้งส่งสินค้า และเริ่มนับเวลาปล่อยเงินอัตโนมัติ 2 วัน
router.patch('/transactions/:transactionId/ship', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const { tracking_number } = req.body;
   db.query(
      `UPDATE transactions
       SET status = 'shipped', shipping_status = 'shipped', tracking_number = ?,
           shipped_at = CURRENT_TIMESTAMP, release_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
       WHERE trans_id = ? AND giver_id = ? AND status = 'paid' AND payment_status = 'held'`,
      [tracking_number || null, transactionId, req.authUser.userId],
      (err, result) => {
         if (err) return res.status(500).json({ success: false, message: 'แจ้งส่งสินค้าไม่สำเร็จ' });
         if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมยังไม่พร้อมแจ้งส่งสินค้า' });
         res.json({ success: true, message: 'แจ้งส่งสินค้าแล้ว ระบบจะปล่อยเงินอัตโนมัติใน 2 วัน' });
      }
   );
});

// คนซื้อยืนยันรับสินค้า ระบบจำลองการปล่อยเงินให้คนขาย
router.post('/transactions/:transactionId/confirm', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   db.query(
      `UPDATE transactions
       SET status = 'released', payment_status = 'released', shipping_status = 'delivered',
           received_at = CURRENT_TIMESTAMP, released_at = CURRENT_TIMESTAMP
       WHERE trans_id = ? AND receiver_id = ? AND status = 'shipped' AND payment_status = 'held'`,
      [transactionId, req.authUser.userId],
      (err, result) => {
         if (err) return res.status(500).json({ success: false, message: 'ยืนยันรับสินค้าไม่สำเร็จ' });
         if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมยังไม่พร้อมยืนยันรับสินค้า' });
         db.query(
            `UPDATE items i JOIN transactions t ON t.item_id = i.item_id
             SET i.status = 'completed' WHERE t.trans_id = ?`,
            [transactionId],
            itemErr => {
               if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะสินค้าไม่สำเร็จ' });
               res.json({ success: true, message: 'ยืนยันรับสินค้าแล้ว ระบบปล่อยเงินให้คนขายแล้ว' });
            }
         );
      }
   );
});

// ตรวจปล่อยเงินอัตโนมัติสำหรับรายการที่ครบกำหนด 2 วัน
function releaseExpiredTransactions() {
   db.query(
      `UPDATE transactions
       SET status = 'released', payment_status = 'released', shipping_status = 'delivered', released_at = CURRENT_TIMESTAMP
       WHERE status = 'shipped' AND payment_status = 'held' AND release_at IS NOT NULL AND release_at <= CURRENT_TIMESTAMP`,
      err => {
         if (err) console.error('Auto Release Transaction Error:', err);
      }
   );
}
setInterval(releaseExpiredTransactions, 60 * 60 * 1000);

module.exports = router;
