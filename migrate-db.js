require('dotenv').config();
const db = require('./config/db');

const sqls = [
    "ALTER TABLE users MODIFY password VARCHAR(255) NULL;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at DATETIME;",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider ENUM('local', 'google') DEFAULT 'local';",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);"
];

(async () => {
    for (let sql of sqls) {
        try {
            await db.promise().query(sql);
            console.log('✅ Executed:', sql);
        } catch (err) {
            console.error('❌ Error executing:', sql, err.message);
        }
    }
    console.log('Migration completed.');
    process.exit(0);
})();

