const fs = require('fs');
let arjs = fs.readFileSync('routes/adminRoutes.js', 'utf8');

const oldReject = `router.delete('/admin/items/:itemId/reject', requireAdmin, (req, res) => {
    db.query('DELETE FROM items WHERE item_id = ?', [req.params.itemId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'ปฏิเสธรายการไม่สำเร็จ' });
        res.json({ success: true, message: 'ลบรายการนี้แล้ว' });
    });
});`;

const newReject = `// 📌 4. แอดมินไม่อนุมัติรายการ (Reject + ระบุเหตุผล)
router.patch('/admin/items/:itemId/reject', requireAdmin, (req, res) => {
    const { reason } = req.body;
    const itemId = req.params.itemId;

    db.query('UPDATE items SET is_approved = FALSE, status = "rejected", rejection_reason = ? WHERE item_id = ?', [reason || 'ไม่ระบุเหตุผล', itemId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'ปฏิเสธรายการไม่สำเร็จ' });
        
        // 🔔 แจ้งเตือนเจ้าของโพสต์
        db.query('SELECT user_id, title FROM items WHERE item_id = ?', [itemId], (err2, rows) => {
            if(!err2 && rows.length > 0) {
                const notifMsg = \`รายการ "\${rows[0].title}" ของคุณถูกไม่อนุมัติ เนื่องจาก: \${reason || 'ไม่ระบุเหตุผล'}\`;
                db.query('INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, NULL, ?, ?, ?)',
                    [rows[0].user_id, 'item_rejected', itemId, notifMsg]
                );
            }
        });
        
        res.json({ success: true, message: 'ไม่อนุมัติรายการนี้แล้ว' });
    });
});`;

if (arjs.includes(oldReject)) {
    arjs = arjs.replace(oldReject, newReject);
    fs.writeFileSync('routes/adminRoutes.js', arjs, 'utf8');
    console.log('Replaced reject endpoint in adminRoutes.js');
} else {
    console.log('Could not find old reject endpoint');
}
