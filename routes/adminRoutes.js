// ====================================================
// 🛡️ adminRoutes.js : API หลังบ้านสำหรับผู้ดูแลระบบ
// ====================================================
const express = require('express');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        let prefix = 'admin-slip';
        if (file.fieldname === 'renter_slip') prefix = 'renter-refund-slip';
        else if (file.fieldname === 'owner_slip') prefix = 'owner-payout-slip';
        cb(null, `${Date.now()}-${prefix}${ext}`);
    }
});
const upload = multer({ storage: storage });
const router = express.Router();
const db = require('../config/db');
const { requireAdmin } = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationHelper');

router.get('/admin/summary', requireAdmin, (req, res) => {
    const queries = {
        users: 'SELECT COUNT(*) AS total FROM users',
        items: 'SELECT COUNT(*) AS total FROM items',
        pendingItems: "SELECT COUNT(*) AS total FROM items WHERE is_approved = FALSE AND status != 'rejected'",
        pendingReports: "SELECT COUNT(*) AS total FROM reports WHERE status = 'pending'",
        transactions: 'SELECT COUNT(*) AS total FROM transactions'
    };
    const keys = Object.keys(queries);
    const summary = {};
    let completed = 0;

    keys.forEach(key => {
        db.query(queries[key], (err, rows) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดสรุปข้อมูลไม่สำเร็จ' });
            summary[key] = rows[0].total;
            completed += 1;
            if (completed === keys.length) res.json({ success: true, summary });
        });
    });
});

router.get('/admin/reports', requireAdmin, (req, res) => {
    const status = ['pending', 'resolved'].includes(req.query.status) ? req.query.status : null;
    const sql = `
        SELECT r.report_id, r.item_id, i.title AS item_title, i.status AS item_status,
               r.reporter_id, u.name AS reporter_name, u.email AS reporter_email,
               r.reported_user_id, ru.name AS reported_name, ru.email AS reported_email,
               r.reason, r.status, r.created_at
        FROM reports r
        JOIN users u ON u.user_id = r.reporter_id
        LEFT JOIN items i ON i.item_id = r.item_id
        LEFT JOIN users ru ON ru.user_id = r.reported_user_id
        ${status ? 'WHERE r.status = ?' : ''}
        ORDER BY r.report_id DESC
    `;
    db.query(sql, status ? [status] : [], (err, reports) => {
        if (err) return res.status(500).json({ success: false, message: 'โหลดรายงานไม่สำเร็จ' });
        res.json({ success: true, reports });
    });
});

router.get('/admin/users', requireAdmin, (req, res) => {
    db.query(
        'SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY user_id DESC',
        (err, users) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดผู้ใช้ไม่สำเร็จ' });
            res.json({ success: true, users });
        }
    );
});

router.get('/admin/items', requireAdmin, (req, res) => {
    db.query(
        `SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.quantity, i.status, i.is_edited,
                i.image_url, i.created_at, u.name AS owner_name, u.email AS owner_email
         FROM items i JOIN users u ON u.user_id = i.user_id
         ORDER BY i.item_id DESC`,
        (err, items) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดสินค้าไม่สำเร็จ' });
            res.json({ success: true, items });
        }
    );
});

router.get('/admin/transactions', requireAdmin, (req, res) => {
    db.query(
        `SELECT t.trans_id, t.item_id, i.title AS item_title, t.amount, t.status,
                t.payment_status, t.shipping_status, t.tracking_number, t.shipped_at, t.release_at, t.payment_reference,
                g.name AS giver_name, r.name AS receiver_name, i.item_type, t.rental_start_date, t.rental_end_date, t.rental_days, t.deposit_amount, t.rental_status, t.return_tracking, t.returned_at,
                t.claim_amount, t.claim_reason, t.claim_image, t.claim_status, t.claim_admin_decision,
                g.promptpay_number AS seller_promptpay, g.promptpay_name AS seller_promptpay_name, r.promptpay_number AS buyer_promptpay, r.promptpay_name AS buyer_promptpay_name, t.admin_slip, t.deposit_refund_slip, t.created_at
         FROM transactions t
         JOIN items i ON i.item_id = t.item_id
         JOIN users g ON g.user_id = t.giver_id
         JOIN users r ON r.user_id = t.receiver_id
         ORDER BY t.trans_id DESC`,
        (err, transactions) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดธุรกรรมไม่สำเร็จ' });
            res.json({ success: true, transactions });
        }
    );
});

router.patch('/admin/reports/:reportId', requireAdmin, (req, res) => {
    const { status } = req.body;
    if (!['pending', 'resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'สถานะรายงานไม่ถูกต้อง' });
    }
    db.query(
        'UPDATE reports SET status = ? WHERE report_id = ?',
        [status, req.params.reportId],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตรายงานไม่สำเร็จ' });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายงาน' });
            res.json({ success: true, message: 'อัปเดตรายงานสำเร็จ' });
        }
    );
});

// 📌 ดึงรายการสินค้าที่รอตรวจสอบ
router.get('/admin/items/pending', requireAdmin, (req, res) => {
    db.query(
        `SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.deposit, i.quantity, i.status,
                i.description, i.location, i.image_url, i.created_at,
                u.name AS owner_name, u.email AS owner_email, u.phone AS owner_phone,
                (SELECT GROUP_CONCAT(img.image_url ORDER BY img.sort_order ASC) FROM item_images img WHERE img.item_id = i.item_id) AS gallery_images
         FROM items i JOIN users u ON u.user_id = i.user_id
         WHERE i.is_approved = FALSE AND i.status != 'rejected'
         ORDER BY i.item_id DESC`,
        (err, items) => {
            if (err) return res.status(500).json({ success: false, message: 'โหลดสินค้ารอตรวจสอบไม่สำเร็จ' });
            res.json({ success: true, items });
        }
    );
});

// 📌 อนุมัติสินค้า
router.patch('/admin/items/:itemId/approve', requireAdmin, (req, res) => {
    const itemId = req.params.itemId;
    db.query('UPDATE items SET is_approved = TRUE, is_edited = FALSE WHERE item_id = ?', [itemId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'อนุมัติรายการไม่สำเร็จ' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });

        // 🔔 แจ้งเตือนเจ้าของโพสต์ว่าได้รับการอนุมัติเรียบร้อยแล้ว
        db.query('SELECT user_id, title, item_type FROM items WHERE item_id = ?', [itemId], (err2, rows) => {
            if (!err2 && rows && rows.length > 0) {
                const typeText = rows[0].item_type === 'rent' ? 'ปล่อยเช่า' : rows[0].item_type === 'sell' ? 'ขาย' : 'ส่งต่อฟรี';
                const notifMsg = `รายการ${typeText} "${rows[0].title}" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!`;
                db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, NULL, ?, ?, ?)',
                    [rows[0].user_id, 'item_approved', itemId, notifMsg]
                );
            }
        });

        res.json({ success: true, message: 'อนุมัติรายการสำเร็จ' });
    });
});

// 📌 ปฏิเสธรายการ (ลบทิ้ง)
router.patch('/admin/items/:itemId/reject', requireAdmin, (req, res) => {
    const { reason } = req.body;
    const itemId = req.params.itemId;

    db.query('UPDATE items SET is_approved = FALSE, status = "rejected", rejection_reason = ? WHERE item_id = ?', [reason || 'ไม่ระบุเหตุผล', itemId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'ปฏิเสธรายการไม่สำเร็จ' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบรายการ' });
        
        // 🔔 แจ้งเตือนเจ้าของโพสต์
        db.query('SELECT user_id, title FROM items WHERE item_id = ?', [itemId], (err2, rows) => {
            if(!err2 && rows.length > 0) {
                const notifMsg = `รายการ "${rows[0].title}" ของคุณไม่อนุมัติ เนื่องจาก: ${reason || 'ไม่ระบุเหตุผล'}`;
                db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, NULL, ?, ?, ?)',
                    [rows[0].user_id, 'item_rejected', itemId, notifMsg]
                );
            }
        });
        
        res.json({ success: true, message: 'ไม่อนุมัติรายการสำเร็จ' });
    });
});

// 📌 แบนบัญชีผู้ใช้
router.patch('/admin/users/:userId/ban', requireAdmin, (req, res) => {
    db.query('UPDATE users SET is_banned = TRUE WHERE user_id = ?', [req.params.userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'แบนบัญชีไม่สำเร็จ' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้นี้' });
        res.json({ success: true, message: 'ระงับบัญชี (Ban) สำเร็จ' });
    });
});

// 📌 ปลดแบนบัญชีผู้ใช้
router.patch('/admin/users/:userId/unban', requireAdmin, (req, res) => {
    db.query('UPDATE users SET is_banned = FALSE WHERE user_id = ?', [req.params.userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'ปลดแบนบัญชีไม่สำเร็จ' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบบัญชีผู้ใช้นี้' });
        res.json({ success: true, message: 'ปลดแบนบัญชี (Unban) สำเร็จ' });
    });
});


router.patch('/admin/transactions/:id/complete', requireAdmin, upload.single('slip'), (req, res) => {
    const { id } = req.params;
    const slipPath = req.file ? '/uploads/' + req.file.filename : null;
    
    // Check if column admin_slip exists in transactions table, if not add it
    db.query("SHOW COLUMNS FROM transactions LIKE 'admin_slip'", (err, rows) => {
        if (rows.length === 0) {
            db.query("ALTER TABLE transactions ADD COLUMN admin_slip VARCHAR(500) NULL", () => {
                updateTransaction();
            });
        } else {
            updateTransaction();
        }
    });
    
    function updateTransaction() {
        let sql = "UPDATE transactions SET status = 'completed', payment_status = 'released', shipping_status = 'delivered'";
        let params = [];
        
        if (slipPath) {
            sql += ", payment_reference = ?"; // fallback if they want to use existing field
            sql += ", admin_slip = ?";
            params.push(slipPath, slipPath);
        }
        
        sql += " WHERE trans_id = ?";
        params.push(id);
        
        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตไม่สำเร็จ' });
            
            if (result.affectedRows > 0) {
                // แจ้งเตือนผู้ขายว่าแอดมินโอนเงินให้แล้ว
                db.query("SELECT giver_id FROM transactions WHERE trans_id = ?", [id], (err2, rows) => {
                    if (!err2 && rows.length > 0) {
                        createNotification(rows[0].giver_id, req.authUser.userId, 'transaction_update', id, "แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว");
                    }
                });
            }

            res.json({ success: true, message: 'โอนเงินให้ผู้ขายและอัปโหลดสลิปสำเร็จ', slipPath });
        });
    }
});

const settleUpload = upload.fields([
    { name: 'owner_slip', maxCount: 1 },
    { name: 'renter_slip', maxCount: 1 },
    { name: 'slip', maxCount: 1 }
]);

// ⚖️ แอดมินไกล่เกลี่ย/ตัดสินเคสของชำรุด และโอนเงินตามสัดส่วน (รองรับสลิปแยก 2 ฝั่ง)
router.patch('/admin/transactions/:id/settle-claim', requireAdmin, settleUpload, (req, res) => {
    const { id } = req.params;
    const { approved_claim_amount, admin_decision } = req.body;

    let ownerSlipPath = null;
    let renterSlipPath = null;

    if (req.files) {
        if (req.files.owner_slip && req.files.owner_slip[0]) {
            ownerSlipPath = '/uploads/' + req.files.owner_slip[0].filename;
        } else if (req.files.slip && req.files.slip[0]) {
            ownerSlipPath = '/uploads/' + req.files.slip[0].filename;
        }

        if (req.files.renter_slip && req.files.renter_slip[0]) {
            renterSlipPath = '/uploads/' + req.files.renter_slip[0].filename;
        }
    } else if (req.file) {
        ownerSlipPath = '/uploads/' + req.file.filename;
    }

    db.query(
        'SELECT t.*, i.title AS item_title FROM transactions t JOIN items i ON i.item_id = t.item_id WHERE t.trans_id = ?',
        [id],
        (err, rows) => {
            if (err || rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบธุรกรรมนี้' });
            const tx = rows[0];

            const finalClaimAmount = approved_claim_amount !== undefined ? Math.max(0, Math.min(Number(approved_claim_amount), Number(tx.deposit_amount || 0))) : Number(tx.claim_amount || 0);
            const totalHeld = Number(tx.amount || 0);
            const deposit = Number(tx.deposit_amount || 0);
            const rent = Math.max(0, totalHeld - deposit);

            const ownerPayout = rent + finalClaimAmount;
            const renterRefund = Math.max(0, deposit - finalClaimAmount);

            let sql = `
                UPDATE transactions
                SET status = 'completed',
                    payment_status = 'released',
                    rental_status = 'returned',
                    claim_status = 'settled',
                    claim_amount = ?,
                    claim_admin_decision = ?,
                    released_at = CURRENT_TIMESTAMP
            `;
            let params = [finalClaimAmount, admin_decision || 'แอดมินดำเนินการโอนเงินแบ่งตามสัดส่วนความเสียหายเรียบร้อยแล้ว'];

            if (ownerSlipPath) {
                sql += ', admin_slip = ?';
                params.push(ownerSlipPath);
            }
            if (renterSlipPath) {
                sql += ', deposit_refund_slip = ?';
                params.push(renterSlipPath);
            }

            sql += ' WHERE trans_id = ?';
            params.push(id);

            db.query(sql, params, (updateErr) => {
                if (updateErr) {
                    console.error('Settle claim error:', updateErr);
                    return res.status(500).json({ success: false, message: 'บันทึกการตัดสินไม่สำเร็จ' });
                }

                // ปรับสถานะสินค้ากลับเป็น available
                db.query("UPDATE items SET status = 'available' WHERE item_id = ?", [tx.item_id]);

                // แจ้งเตือนผู้ให้เช่า
                const ownerMsg = `แอดมินได้โอนค่าเช่าพร้อมค่าชดเชยความเสียหาย (รวม ฿${ownerPayout.toLocaleString()}) สำหรับ "${tx.item_title}" ให้คุณเรียบร้อยแล้ว`;
                createNotification(tx.giver_id, req.authUser.userId, 'transaction_update', id, ownerMsg).catch(console.error);

                // แจ้งเตือนผู้เช่า
                const renterMsg = renterRefund > 0
                    ? `แอดมินได้ดำเนินการคืนเงินมัดจำส่วนที่เหลือ ฿${renterRefund.toLocaleString()} สำหรับ "${tx.item_title}" ให้คุณเรียบร้อยแล้ว`
                    : `การเช่า "${tx.item_title}" เสร็จสิ้นแล้ว (หักเงินมัดจำชดใช้ค่าเสียหายเต็มจำนวน)`;
                createNotification(tx.receiver_id, req.authUser.userId, 'transaction_update', id, renterMsg).catch(console.error);

                res.json({
                    success: true,
                    message: 'ตัดสินและโอนเงินแบ่งตามสัดส่วนความเสียหายสำเร็จ',
                    ownerPayout,
                    renterRefund,
                    ownerSlipPath,
                    renterSlipPath
                });
            });
        }
    );
});

module.exports = router;
