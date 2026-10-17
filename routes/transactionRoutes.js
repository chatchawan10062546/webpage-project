// ====================================================
// 💳 transactionRoutes.js : API ธุรกรรมคนกลาง (โหมดทดสอบ & ระบบปล่อยเช่า)
// ====================================================
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { createNotification } = require('../utils/notificationHelper');
const { requireAuth } = require('../middleware/authMiddleware');
const { verifySlip } = require('../utils/slipVerifier');

const storage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, 'uploads/'),
   filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const prefix = file.fieldname === 'slip' ? 'buyer-slip' : 'damage';
      cb(null, `${Date.now()}-${prefix}${ext}`);
   }
});
const upload = multer({ storage: storage });

router.post('/transactions', requireAuth, (req, res) => {
   const { item_id, rental_start_date, rental_end_date, rental_days } = req.body;
   const buyerId = req.authUser.userId;

   if (!item_id) return res.status(400).json({ success: false, message: 'ไม่พบรายการสินค้า' });

   db.query(
      'SELECT item_id, user_id, item_type, price, deposit, status FROM items WHERE item_id = ?',
      [item_id],
      (itemErr, items) => {
         if (itemErr) return res.status(500).json({ success: false, message: 'ตรวจสอบสินค้าไม่สำเร็จ' });
         if (items.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบสินค้านี้' });

         const item = items[0];
         if (String(item.user_id) === String(buyerId)) {
            return res.status(400).json({ success: false, message: 'ไม่สามารถทำรายการกับสินค้าของตัวเองได้' });
         }
         if (item.item_type === 'free') {
            return res.status(400).json({ success: false, message: 'สินค้าฟรีไม่ต้องใช้ระบบคนกลาง' });
         }
         if (item.status !== 'available') {
            return res.status(409).json({ success: false, message: 'สินค้านี้ไม่พร้อมให้ทำรายการแล้ว' });
         }

         let calculatedAmount = Number(item.price || 0);
         let depositAmount = 0;
         let days = 1;
         const isRental = item.item_type === 'rent';

         if (isRental) {
            days = Math.max(1, parseInt(rental_days) || 1);
            depositAmount = Number(item.deposit || 0);
            calculatedAmount = (Number(item.price || 0) * days) + depositAmount;
         }

         db.query(
            `SELECT trans_id, amount FROM transactions
             WHERE item_id = ? AND receiver_id = ?
               AND status = 'awaiting_payment'
             LIMIT 1`,
            [item_id, buyerId],
            (existingErr, existing) => {
               if (existingErr) return res.status(500).json({ success: false, message: 'ตรวจสอบธุรกรรมไม่สำเร็จ' });
               if (existing.length > 0) {
                  db.query(
                     `UPDATE transactions 
                      SET amount = ?, rental_start_date = ?, rental_end_date = ?, rental_days = ?, deposit_amount = ?
                      WHERE trans_id = ?`,
                     [
                        calculatedAmount,
                        isRental ? (rental_start_date || null) : null,
                        isRental ? (rental_end_date || null) : null,
                        isRental ? days : 0,
                        depositAmount,
                        existing[0].trans_id
                     ],
                     () => {
                        res.json({ success: true, transaction_id: existing[0].trans_id, amount: calculatedAmount, existing: true });
                     }
                  );
                  return;
               }

               db.query(
                  `INSERT INTO transactions
                   (item_id, giver_id, receiver_id, amount, status, payment_status, shipping_status, rental_start_date, rental_end_date, rental_days, deposit_amount, rental_status)
                   VALUES (?, ?, ?, ?, 'awaiting_payment', 'pending', 'pending', ?, ?, ?, ?, ?)`,
                  [
                     item_id, 
                     item.user_id, 
                     buyerId, 
                     calculatedAmount,
                     isRental ? (rental_start_date || null) : null,
                     isRental ? (rental_end_date || null) : null,
                     isRental ? days : 0,
                     depositAmount,
                     isRental ? 'pending_payment' : null
                  ],
                  (insertErr, result) => {
                     if (insertErr) {
                        console.error('Create Transaction Error:', insertErr);
                        return res.status(500).json({ success: false, message: 'สร้างธุรกรรมไม่สำเร็จ' });
                     }
                     res.json({ success: true, transaction_id: result.insertId, amount: calculatedAmount });
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
      SELECT t.*, i.title, i.image_url, i.item_type, g.name AS giver_name, r.name AS receiver_name
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

// ชำระเงินและพักเงินไว้ในระบบคนกลาง (พร้อมแนบสลิปและตรวจ SlipOK อัตโนมัติ)
router.post('/transactions/:transactionId/pay', requireAuth, upload.single('slip'), async (req, res) => {
   const { transactionId } = req.params;
   const buyerId = req.authUser.userId;
   const slipPath = req.file ? '/uploads/' + req.file.filename : null;

   if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาแนบรูปภาพสลิปการโอนเงิน' });
   }

   db.query(
      `SELECT t.*, i.item_type, i.title AS item_title 
       FROM transactions t 
       JOIN items i ON i.item_id = t.item_id 
       WHERE t.trans_id = ?`,
      [transactionId],
      async (err, rows) => {
         if (err || rows.length === 0) {
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
            return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
         }
         const tx = rows[0];
         const giverId = tx.giver_id;

         if (tx.receiver_id !== buyerId) {
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
            return res.status(403).json({ success: false, message: 'คุณไม่ใช่ผู้ซื้อในธุรกรรมนี้' });
         }

         if (tx.status !== 'awaiting_payment') {
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
            return res.status(400).json({ success: false, message: 'ธุรกรรมนี้ไม่ได้อยู่ในสถานะรอชำระเงิน' });
         }

         // 🔍 ตรวจสอบสลิปผ่าน SlipOK API อัตโนมัติ
         const fullSlipPath = path.resolve(req.file.path);
         const expectedAmount = Number(tx.amount || 0);

         const verifyResult = await verifySlip({
            filePath: fullSlipPath,
            expectedAmount,
            db
         });

         if (!verifyResult.success) {
            if (req.file) { try { fs.unlinkSync(req.file.path); } catch (e) {} }
            return res.status(400).json({
               success: false,
               message: verifyResult.message || 'สลิปโอนเงินไม่ถูกต้อง',
               code: verifyResult.code
            });
         }

         // ✅ สลิปถูกต้อง บันทึกข้อมูลลงฐานข้อมูล
         let sql = `UPDATE transactions
                    SET status = 'paid', payment_status = 'held', paid_at = CURRENT_TIMESTAMP,
                        payment_reference = ?,
                        trans_ref = ?,
                        is_slip_verified = ?,
                        slip_verified_at = CURRENT_TIMESTAMP,
                        slip_raw_data = ?`;
         let params = [
            slipPath,
            verifyResult.transRef || null,
            verifyResult.isManual ? 0 : 1,
            JSON.stringify(verifyResult.raw || {})
         ];

         if (tx.item_type === 'rent') {
            sql += `, rental_status = 'paid'`;
         }

         sql += ` WHERE trans_id = ? AND receiver_id = ? AND status = 'awaiting_payment'`;
         params.push(transactionId, buyerId);

         db.query(sql, params, (updateErr, result) => {
            if (updateErr) return res.status(500).json({ success: false, message: 'ชำระเงินไม่สำเร็จ' });
            if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมชำระเงิน (อาจชำระไปแล้วหรือถูกยกเลิก)' });

            db.query(
               `UPDATE items SET status = 'reserved' WHERE item_id = ?`,
               [tx.item_id],
               itemErr => {
                  if (itemErr) return res.status(500).json({ success: false, message: 'อัปเดตสถานะสินค้าไม่สำเร็จ' });
                  if (typeof createNotification === 'function') {
                     createNotification(giverId, buyerId, 'transaction_update', transactionId, `มีผู้ชำระเงินสำหรับ "${tx.item_title}" แล้ว กรุณาจัดส่งสินค้า`).catch(console.error);
                  }
                  res.json({
                     success: true,
                     message: 'ตรวจสอบสลิปสำเร็จ! ชำระเงินเรียบร้อย เงินถูกพักไว้ในระบบกลางอย่างปลอดภัย',
                     slipPath,
                     transRef: verifyResult.transRef,
                     verified: !verifyResult.isManual
                  });
               }
            );
         });
      }
   );
});


// ผู้ซื้อ/ผู้เช่ายกเลิกรายการสั่งซื้อ/เช่า (ก่อนชำระเงิน)
router.patch('/transactions/:transactionId/cancel', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const userId = req.authUser.userId;

   db.query(
      `SELECT t.*, i.title AS item_title 
       FROM transactions t 
       JOIN items i ON i.item_id = t.item_id 
       WHERE t.trans_id = ?`,
      [transactionId],
      (err, rows) => {
         if (err || rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบธุรกรรม' });
         const tx = rows[0];

         if (tx.receiver_id !== userId) {
            return res.status(403).json({ success: false, message: 'คุณไม่มีสิทธิ์ยกเลิกรายการนี้' });
         }

         if (tx.status !== 'awaiting_payment') {
            return res.status(400).json({ success: false, message: 'สามารถยกเลิกได้เฉพาะรายการที่ยังไม่ได้ชำระเงินเท่านั้น' });
         }

         db.query(
            `UPDATE transactions SET status = 'cancelled' WHERE trans_id = ? AND status = 'awaiting_payment'`,
            [transactionId],
            (updateErr, result) => {
               if (updateErr || result.affectedRows === 0) {
                  return res.status(500).json({ success: false, message: 'ยกเลิกรายการไม่สำเร็จ' });
               }

               // คืนสถานะสินค้าให้กลับมาเป็นว่าง (available)
               db.query(
                  `UPDATE items SET status = 'available' WHERE item_id = ?`,
                  [tx.item_id],
                  () => {
                     if (typeof createNotification === 'function') {
                        createNotification(tx.giver_id, userId, 'transaction_cancelled', transactionId, `ผู้ซื้อได้ยกเลิกคำสั่งซื้อสำหรับ "${tx.item_title}" แล้ว`).catch(console.error);
                     }
                     res.json({ success: true, message: 'ยกเลิกรายการเรียบร้อยแล้ว สินค้าถูกคืนสถานะว่าง' });
                  }
               );
            }
         );
      }
   );
});

// คนขายแจ้งส่งสินค้า และเริ่มนับเวลาปล่อยเงินอัตโนมัติ 2 วัน
router.patch('/transactions/:transactionId/ship', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const { tracking_number } = req.body;
   const sellerId = req.authUser.userId;
   db.query('SELECT receiver_id FROM transactions WHERE trans_id = ?', [transactionId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
       const receiverId = rows[0].receiver_id;
       db.query(
          `UPDATE transactions
           SET status = 'shipped', shipping_status = 'shipped', tracking_number = ?,
               shipped_at = CURRENT_TIMESTAMP, release_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
           WHERE trans_id = ? AND giver_id = ? AND status = 'paid' AND payment_status = 'held'`,
          [tracking_number || null, transactionId, sellerId],
          (err, result) => {
             if (err) return res.status(500).json({ success: false, message: 'แจ้งส่งสินค้าไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมจัดส่ง' });
             if (typeof createNotification === 'function') {
                 createNotification(receiverId, sellerId, 'transaction_update', transactionId, `ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: ${tracking_number || '-'}) ตรวจสอบและกดยืนยันเมื่อได้รับของ`).catch(console.error);
             }
             res.json({ success: true, message: 'แจ้งจัดส่งสินค้าสำเร็จ' });
          }
       );
   });
});

// คนซื้อยืนยันรับสินค้า
router.post('/transactions/:transactionId/confirm', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const buyerId = req.authUser.userId;

   db.query(
      `SELECT t.trans_id, t.giver_id, t.item_id, i.item_type, t.deposit_amount 
       FROM transactions t 
       JOIN items i ON i.item_id = t.item_id 
       WHERE t.trans_id = ?`, 
      [transactionId], 
      (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรม' });
       const tx = rows[0];
       const giverId = tx.giver_id;

       if (tx.item_type === 'rent') {
           // 🔑 สำหรับการเช่า: ยืนยันรับของแล้ว -> เปลี่ยนสถานะเป็น renting (เริ่มต้นระยะเวลาเช่า พักเงินไว้ต่อจนกว่าจะส่งคืน)
           db.query(
              `UPDATE transactions
               SET status = 'renting', rental_status = 'renting', shipping_status = 'delivered'
               WHERE trans_id = ? AND receiver_id = ? AND (status = 'shipped' OR status = 'paid') AND payment_status = 'held'`,
              [transactionId, buyerId],
              (err, result) => {
                 if (err) return res.status(500).json({ success: false, message: 'ยืนยันการรับสินค้าไม่สำเร็จ' });
                 if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมยืนยัน' });
                 if (typeof createNotification === 'function') {
                     createNotification(giverId, buyerId, 'transaction_update', transactionId, 'ผู้เช่าได้รับสินค้าแล้ว เริ่มต้นระยะเวลาการเช่า').catch(console.error);
                 }
                 res.json({ success: true, message: 'ยืนยันรับสินค้าเรียบร้อย เริ่มต้นระยะเวลาการเช่า' });
              }
           );
       } else {
           // 🏷️ สำหรับการซื้อขายขาด: ยืนยันรับของแล้ว -> ปล่อยเงิน
           db.query(
              `UPDATE transactions
               SET status = 'released', payment_status = 'released', shipping_status = 'delivered', released_at = CURRENT_TIMESTAMP
               WHERE trans_id = ? AND receiver_id = ? AND (status = 'shipped' OR status = 'paid') AND payment_status = 'held'`,
              [transactionId, buyerId],
              (err, result) => {
                 if (err) return res.status(500).json({ success: false, message: 'ยืนยันการรับสินค้าไม่สำเร็จ' });
                 if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่พร้อมยืนยัน' });
                 if (typeof createNotification === 'function') {
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
       }
   });
});

// 📦 ผู้เช่าแจ้งส่งคืนสินค้า
router.post('/transactions/:transactionId/return', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const { return_tracking } = req.body;
   const buyerId = req.authUser.userId;

   db.query('SELECT giver_id FROM transactions WHERE trans_id = ? AND receiver_id = ?', [transactionId, buyerId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรมนี้' });
       const giverId = rows[0].giver_id;

       db.query(
          `UPDATE transactions
           SET rental_status = 'returning', return_tracking = ?, returned_at = CURRENT_TIMESTAMP
           WHERE trans_id = ? AND receiver_id = ? AND (rental_status = 'renting' OR status = 'renting')`,
          [return_tracking || 'ส่งคืนเรียบร้อย', transactionId, buyerId],
          (updateErr, result) => {
             if (updateErr) return res.status(500).json({ success: false, message: 'แจ้งส่งคืนสินค้าไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่อยู่ในสถานะที่ส่งคืนได้' });

             if (typeof createNotification === 'function') {
                 createNotification(giverId, buyerId, 'transaction_update', transactionId, `ผู้เช่าได้แจ้งส่งคืนสินค้าแล้ว (${return_tracking || 'ส่งคืนแล้ว'}) กรุณาตรวจรับของ`).catch(console.error);
             }
             res.json({ success: true, message: 'แจ้งส่งคืนสินค้าเรียบร้อยแล้ว รอผู้ให้เช่าตรวจรับของ' });
          }
       );
   });
});

// ✅ ผู้ให้เช่ายืนยันได้รับสินค้าคืนเรียบร้อย (อนุมัติคืนมัดจำ & ปล่อยค่าเช่า)
router.post('/transactions/:transactionId/confirm-return', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const sellerId = req.authUser.userId;

   db.query('SELECT receiver_id, item_id FROM transactions WHERE trans_id = ? AND giver_id = ?', [transactionId, sellerId], (err, rows) => {
       if (err || rows.length === 0) return res.status(500).json({ success: false, message: 'ไม่พบธุรกรรมนี้' });
       const { receiver_id: buyerId, item_id: itemId } = rows[0];

       db.query(
          `UPDATE transactions
           SET rental_status = 'returned', status = 'released', payment_status = 'released', released_at = CURRENT_TIMESTAMP
           WHERE trans_id = ? AND giver_id = ? AND rental_status = 'returning'`,
          [transactionId, sellerId],
          (updateErr, result) => {
             if (updateErr) return res.status(500).json({ success: false, message: 'ยืนยันรับสินค้าคืนไม่สำเร็จ' });
             if (result.affectedRows === 0) return res.status(400).json({ success: false, message: 'ธุรกรรมไม่อยู่ในสถานะที่ยืนยันการคืนได้' });

             // ปรับสถานะสินค้าเป็น completed เมื่อคืนของสำเร็จ
             db.query("UPDATE items SET status = 'completed' WHERE item_id = ?", [itemId], () => {});

             if (typeof createNotification === 'function') {
                 createNotification(buyerId, sellerId, 'transaction_update', transactionId, 'ผู้ให้เช่าได้รับสินค้าคืนสมบูรณ์แล้ว แอดมินจะดำเนินการโอนเงินมัดจำคืนให้คุณ').catch(console.error);
             }
             res.json({ success: true, message: 'ตรวจรับสินค้าคืนเรียบร้อยแล้ว แอดมินจะดำเนินการโอนค่าเช่าให้คุณและคืนมัดจำให้ผู้เช่า' });
          }
       );
   });
});

// ⚠️ 1. เจ้าของแจ้งพบของชำรุด / ขอหักเงินมัดจำ
router.post('/transactions/:transactionId/claim-damage', requireAuth, upload.single('claim_image'), (req, res) => {
   const { transactionId } = req.params;
   const ownerId = req.authUser.userId;
   const { claim_amount, claim_reason } = req.body;

   if (!claim_amount || Number(claim_amount) <= 0) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุจำนวนเงินที่ขอหักจากมัดจำให้ถูกต้อง' });
   }
   if (!claim_reason || !claim_reason.trim()) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุรายละเอียดความเสียหาย' });
   }

   const claimImage = req.file ? '/uploads/' + req.file.filename : null;

   db.query(
      'SELECT trans_id, item_id, receiver_id, deposit_amount, rental_status FROM transactions WHERE trans_id = ? AND giver_id = ?',
      [transactionId, ownerId],
      (err, rows) => {
         if (err || rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบธุรกรรมนี้' });
         const tx = rows[0];

         if (Number(claim_amount) > Number(tx.deposit_amount || 0)) {
            return res.status(400).json({ success: false, message: `ยอดเงินที่ขอหัก (฿${Number(claim_amount).toLocaleString()}) ต้องไม่เกินเงินมัดจำ (฿${Number(tx.deposit_amount || 0).toLocaleString()})` });
         }

         db.query(
            `UPDATE transactions
             SET rental_status = 'damage_claimed',
                 status = 'disputed',
                 claim_amount = ?,
                 claim_reason = ?,
                 claim_image = COALESCE(?, claim_image),
                 claim_status = 'pending'
             WHERE trans_id = ? AND giver_id = ?`,
            [Number(claim_amount), claim_reason.trim(), claimImage, transactionId, ownerId],
            (updateErr) => {
               if (updateErr) {
                  console.error('Claim Damage Error:', updateErr);
                  return res.status(500).json({ success: false, message: 'บันทึกการแจ้งความเสียหายไม่สำเร็จ' });
               }

               // แจ้งเตือนผู้เช่า
               if (typeof createNotification === 'function') {
                  const notifMsg = `ผู้ให้เช่าแจ้งพบของชำรุด และขอหักเงินมัดจำ ฿${Number(claim_amount).toLocaleString()} เนื่องจาก: ${claim_reason.trim()}`;
                  createNotification(tx.receiver_id, ownerId, 'transaction_update', transactionId, notifMsg).catch(console.error);
               }

               // แจ้งเตือนแอดมินทุกคน
               db.query("SELECT user_id FROM users WHERE role = 'admin'", (admErr, admins) => {
                  if (!admErr && admins && admins.length > 0) {
                     const admMsg = `รายการเช่า #${transactionId} มีการแจ้งของชำรุด ขอหักมัดจำ ฿${Number(claim_amount).toLocaleString()} รอการตรวจสอบ`;
                     admins.forEach(adm => {
                        createNotification(adm.user_id, ownerId, 'damage_claimed', transactionId, admMsg).catch(console.error);
                     });
                  }
               });

               res.json({ success: true, message: 'ส่งคำขอหักเงินมัดจำเรียบร้อยแล้ว รอผู้เช่าพิจารณาและตรวจสอบ' });
            }
         );
      }
   );
});

// 💬 2. ผู้เช่าตอบรับหรือปฏิเสธยอดหักมัดจำ
router.post('/transactions/:transactionId/respond-claim', requireAuth, (req, res) => {
   const { transactionId } = req.params;
   const renterId = req.authUser.userId;
   const { action } = req.body; // 'accept' or 'dispute'

   if (!['accept', 'dispute'].includes(action)) {
      return res.status(400).json({ success: false, message: 'การดำเนินการไม่ถูกต้อง' });
   }

   db.query(
      'SELECT trans_id, giver_id, claim_amount, claim_status FROM transactions WHERE trans_id = ? AND receiver_id = ?',
      [transactionId, renterId],
      (err, rows) => {
         if (err || rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบธุรกรรมนี้' });
         const tx = rows[0];

         if (tx.claim_status !== 'pending') {
            return res.status(400).json({ success: false, message: 'คำขอนี้ได้รับการดำเนินการไปแล้ว' });
         }

         const newClaimStatus = action === 'accept' ? 'accepted' : 'rejected';

         db.query(
            'UPDATE transactions SET claim_status = ? WHERE trans_id = ? AND receiver_id = ?',
            [newClaimStatus, transactionId, renterId],
            (updateErr) => {
               if (updateErr) return res.status(500).json({ success: false, message: 'อัปเดตไม่สำเร็จ' });

               const ownerId = tx.giver_id;
               if (action === 'accept') {
                  createNotification(ownerId, renterId, 'transaction_update', transactionId, `ผู้เช่ายินยอมให้หักเงินมัดจำ ฿${Number(tx.claim_amount).toLocaleString()} เรียบร้อยแล้ว แอดมินจะดำเนินการโอนเงินตามสัดส่วน`).catch(console.error);
                  res.json({ success: true, message: 'คุณได้ยินยอมการหักเงินมัดจำเรียบร้อยแล้ว แอดมินจะดำเนินการโอนเงินคืนส่วนที่เหลือให้คุณ' });
               } else {
                  createNotification(ownerId, renterId, 'transaction_update', transactionId, `ผู้เช่าไม่ยินยอมให้หักเงินมัดจำสำหรับรายการ #${transactionId} ข้อพิพาทถูกส่งต่อให้แอดมินตัดสินชี้ขาด`).catch(console.error);
                  res.json({ success: true, message: 'คุณได้ปฏิเสธยอดหักเงินมัดจำ ข้อพิพาทถูกส่งต่อไปยังแอดมินเพื่อพิจารณาตัดสินชี้ขาด' });
               }
            }
         );
      }
   );
});

// ตรวจปล่อยเงินอัตโนมัติสำหรับรายการที่ครบกำหนด 2 วัน (เฉพาะการซื้อขายขาด ไม่รวมการเช่า)
function releaseExpiredTransactions() {
   db.query(
      `UPDATE transactions t
       JOIN items i ON i.item_id = t.item_id
       SET t.status = 'released', t.payment_status = 'released', t.shipping_status = 'delivered', t.released_at = CURRENT_TIMESTAMP, i.status = 'completed'
       WHERE t.status = 'shipped' AND t.payment_status = 'held' AND t.release_at IS NOT NULL AND t.release_at <= CURRENT_TIMESTAMP
         AND i.item_type != 'rent'`,
      err => {
         if (err) console.error('Auto Release Transaction Error:', err);
      }
   );
}
setInterval(releaseExpiredTransactions, 60 * 60 * 1000);

// 📌 ดึงรายการประวัติการซื้อขายของฉัน (รองรับข้อมูลปล่อยเช่าและการเคลมมัดจำ)
router.get('/transactions/me/all', requireAuth, (req, res) => {
    const userId = req.authUser.userId;
    db.query(
        `SELECT t.trans_id, t.item_id, i.title, i.image_url, i.item_type, t.amount, t.status, t.payment_status, t.shipping_status,
                t.rental_start_date, t.rental_end_date, t.rental_days, t.deposit_amount, t.rental_status, t.return_tracking, t.returned_at,
                t.claim_amount, t.claim_reason, t.claim_image, t.claim_status, t.claim_admin_decision,
                t.giver_id, t.receiver_id, g.name AS seller_name, r.name AS buyer_name, t.created_at, t.payment_reference, t.admin_slip, t.deposit_refund_slip
         FROM transactions t
         JOIN items i ON i.item_id = t.item_id
         JOIN users g ON g.user_id = t.giver_id
         JOIN users r ON r.user_id = t.receiver_id
         WHERE t.giver_id = ? OR t.receiver_id = ?
         ORDER BY t.created_at DESC`,
        [userId, userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
            res.json({ success: true, transactions: results });
        }
    );
});

// 🔔 ดึงจำนวนรายการที่ต้องดำเนินการ / กำลังดำเนินการ ในระบบคนกลาง (สำหรับแสดงตัวเลขแจ้งเตือน Badge)
router.get('/transactions/me/badge-count', requireAuth, (req, res) => {
    const userId = req.authUser.userId;

    const sql = `
        SELECT 
            t.trans_id,
            t.giver_id,
            t.receiver_id,
            t.status,
            t.shipping_status,
            t.rental_status,
            t.claim_status,
            i.item_type
        FROM transactions t
        JOIN items i ON i.item_id = t.item_id
        WHERE (t.giver_id = ? OR t.receiver_id = ?)
          AND t.status NOT IN ('completed', 'cancelled')
    `;

    db.query(sql, [userId, userId], (err, rows) => {
        if (err) {
            console.error('Badge count error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        let actionCount = 0;
        let activeCount = rows.length;

        rows.forEach(t => {
            const isBuyer = String(t.receiver_id) === String(userId);
            const isRental = t.item_type === 'rent';
            const isShipped = t.shipping_status === 'shipped' || t.shipping_status === 'delivered';
            const isRentingOrBeyond = ['renting', 'returning', 'returned', 'damage_claimed'].includes(t.rental_status);

            if (isBuyer) {
                if (t.status === 'awaiting_payment') {
                    actionCount++;
                } else if (isRental && !isRentingOrBeyond && isShipped) {
                    actionCount++;
                } else if (!isRental && isShipped) {
                    actionCount++;
                } else if (isRental && t.rental_status === 'damage_claimed' && t.claim_status === 'pending') {
                    actionCount++;
                }
            } else {
                if (isRental) {
                    if (!isShipped && !isRentingOrBeyond && (t.rental_status === 'paid' || t.status === 'paid')) {
                        actionCount++;
                    } else if (t.rental_status === 'returning') {
                        actionCount++;
                    } else if (t.rental_status === 'damage_claimed' && t.claim_status === 'pending') {
                        actionCount++;
                    }
                } else {
                    if (t.status === 'paid' && !isShipped) {
                        actionCount++;
                    }
                }
            }
        });

        db.query(
            "SELECT COUNT(*) AS unread_tx_notifs FROM notifications WHERE user_id = ? AND is_read = 0 AND type IN ('transaction_update', 'damage_claimed')",
            [userId],
            (notifErr, notifRows) => {
                const unreadNotifs = (!notifErr && notifRows && notifRows[0]) ? notifRows[0].unread_tx_notifs : 0;
                const totalBadge = (actionCount > 0 || unreadNotifs > 0) ? (actionCount + unreadNotifs) : activeCount;

                res.json({
                    success: true,
                    count: totalBadge,
                    actionCount,
                    activeCount,
                    unreadNotifs
                });
            }
        );
    });
});

module.exports = router;

