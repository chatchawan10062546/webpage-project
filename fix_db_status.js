const db = require('./config/db');
db.query("ALTER TABLE items MODIFY status ENUM('available','reserved','completed','rejected') DEFAULT 'available'", (err) => {
    if (err) {
        console.error('Alter error:', err);
        process.exit(1);
    }
    db.query("UPDATE items SET status = 'rejected' WHERE status = '' OR status IS NULL OR (is_approved = 0 AND status != 'available')", (err2, result) => {
        if (err2) console.error('Update error:', err2);
        else console.log('Fixed', result.affectedRows, 'items');
        process.exit(0);
    });
});
