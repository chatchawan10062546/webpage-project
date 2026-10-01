const fs = require('fs');
let c = fs.readFileSync('routes/transactionRoutes.js', 'utf8');

const newRoute = `
// 📌 [Phase 6] ดึงรายการประวัติการซื้อขายของฉัน
router.get('/transactions/me/all', requireAuth, (req, res) => {
    const userId = req.authUser.userId;
    db.query(
        \`SELECT t.trans_id, t.item_id, i.title, i.images, t.amount, t.status, t.payment_status, t.shipping_status,
                t.giver_id, t.receiver_id, g.name AS seller_name, r.name AS buyer_name, t.created_at
         FROM transactions t
         JOIN items i ON i.item_id = t.item_id
         JOIN users g ON g.user_id = t.giver_id
         JOIN users r ON r.user_id = t.receiver_id
         WHERE t.giver_id = ? OR t.receiver_id = ?
         ORDER BY t.created_at DESC\`,
        [userId, userId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
            
            // แปลง images จาก string JSON ให้เป็น array ส่งกลับไป
            const transactions = results.map(t => {
                let parsedImages = [];
                try { parsedImages = JSON.parse(t.images); } catch(e) {}
                t.image_url = parsedImages[0] || null;
                delete t.images;
                return t;
            });
            
            res.json({ success: true, transactions });
        }
    );
});
`;

c = c.replace("module.exports = router;", newRoute + "\nmodule.exports = router;");
fs.writeFileSync('routes/transactionRoutes.js', c, 'utf8');
console.log('Added /transactions/me/all route');
