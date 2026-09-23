const fs = require('fs');
let c = fs.readFileSync('config/db-schema.sql', 'utf8');

c = c.replace(/is_approved BOOLEAN DEFAULT FALSE,/, "is_approved BOOLEAN DEFAULT FALSE,\n    is_edited BOOLEAN DEFAULT FALSE,");

fs.writeFileSync('config/db-schema.sql', c, 'utf8');
console.log('Updated db-schema.sql with is_edited');
