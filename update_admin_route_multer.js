const fs = require('fs');
let c = fs.readFileSync('routes/adminRoutes.js', 'utf8');

if (!c.includes("const multer = require('multer');")) {
    c = c.replace("const express = require('express');", "const express = require('express');\nconst multer = require('multer');\nconst path = require('path');\nconst storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, 'uploads/'), filename: (req, file, cb) => cb(null, Date.now() + '-admin-slip' + path.extname(file.originalname)) });\nconst upload = multer({ storage: storage });");
}

const oldRoute = `router.patch('/admin/transactions/:id/complete', requireAdmin, (req, res) => {
    const { id } = req.params;
    db.query(
        "UPDATE transactions SET status = 'completed' WHERE trans_id = ? AND status = 'released'",
        [id],
        (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตไม่สำเร็จ' });
            res.json({ success: true, message: 'โอนเงินให้ผู้ขายสำเร็จ' });
        }
    );
});`;

const newRoute = `router.patch('/admin/transactions/:id/complete', requireAdmin, upload.single('slip'), (req, res) => {
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
        let sql = "UPDATE transactions SET status = 'completed'";
        let params = [];
        
        if (slipPath) {
            sql += ", payment_reference = ?"; // fallback if they want to use existing field
            sql += ", admin_slip = ?";
            params.push(slipPath, slipPath);
        }
        
        sql += " WHERE trans_id = ? AND status = 'released'";
        params.push(id);
        
        db.query(sql, params, (err, result) => {
            if (err) return res.status(500).json({ success: false, message: 'อัปเดตไม่สำเร็จ' });
            res.json({ success: true, message: 'โอนเงินให้ผู้ขายและอัปโหลดสลิปสำเร็จ', slipPath });
        });
    }
});`;

c = c.replace(oldRoute, newRoute);
fs.writeFileSync('routes/adminRoutes.js', c, 'utf8');
console.log('Added multer and slip upload to adminRoutes.js');
