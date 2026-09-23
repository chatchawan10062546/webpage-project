const fs = require('fs');
let schema = fs.readFileSync('config/db-schema.sql', 'utf8');
if (schema.includes("status ENUM('available', 'reserved', 'completed') DEFAULT 'available',")) {
    schema = schema.replace(
        "status ENUM('available', 'reserved', 'completed') DEFAULT 'available',",
        "status ENUM('available', 'reserved', 'completed', 'rejected') DEFAULT 'available',"
    );
    fs.writeFileSync('config/db-schema.sql', schema, 'utf8');
    console.log('Updated db-schema.sql');
} else {
    console.log('String not found in db-schema.sql');
}
