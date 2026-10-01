const fs = require('fs');
let c = fs.readFileSync('routes/adminRoutes.js', 'utf8');

if (!c.includes('/admin/transactions/:id/complete')) {
    const newRoute = `
router.patch('/admin/transactions/:id/complete', requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query(
        "UPDATE transactions SET status = 'completed' WHERE trans_id = ? AND status = 'released'",
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตไม่สำเร็จ' });
            res.json({ success: true, message: 'โอนเงินให้ผู้ขายสำเร็จ' });
        }
    );
});
`;
    c = c.replace('module.exports = router;', newRoute + '\nmodule.exports = router;');
    fs.writeFileSync('routes/adminRoutes.js', c, 'utf8');
    console.log('Added complete route to adminRoutes');
} else {
    console.log('Route already exists');
}
