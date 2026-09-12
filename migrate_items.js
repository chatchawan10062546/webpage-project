const db = require('./config/db');

// Add column is_approved to items table
db.query('ALTER TABLE items ADD COLUMN is_approved BOOLEAN DEFAULT FALSE;', (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error('Error adding column:', err);
    } else {
        console.log('Added is_approved column successfully (or already exists).');
        
        // Approve existing items so they don't disappear
        db.query('UPDATE items SET is_approved = TRUE WHERE is_approved = FALSE;', (err2) => {
            if (err2) {
                console.error('Error updating existing items:', err2);
            } else {
                console.log('Existing items approved successfully.');
            }
            process.exit();
        });
    }
});
