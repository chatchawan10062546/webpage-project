const fs = require('fs');
let c = fs.readFileSync('config/db-schema.sql', 'utf8');

if (!c.includes('promptpay_number')) {
    c = c.replace(
        "auth_provider ENUM('local', 'google') DEFAULT 'local',",
        "auth_provider ENUM('local', 'google') DEFAULT 'local',\n    promptpay_number VARCHAR(20) NULL,\n    promptpay_name VARCHAR(100) NULL,"
    );
    fs.writeFileSync('config/db-schema.sql', c, 'utf8');
    console.log('Updated db-schema.sql');
} else {
    console.log('Already updated db-schema.sql');
}
