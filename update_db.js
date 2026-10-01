const db = require('./config/db.js');
db.query("ALTER TABLE users ADD COLUMN promptpay_number VARCHAR(20) NULL, ADD COLUMN promptpay_name VARCHAR(100) NULL;", (err) => {
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error(err);
    } else {
        console.log('Columns added successfully (or already exist)');
    }
    process.exit();
});
