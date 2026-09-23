const fs = require('fs');
let c = fs.readFileSync('config/db-schema.sql', 'utf8');

c = c.replace(/status ENUM\('available','reserved','completed','rejected'\) DEFAULT 'available',/, "status ENUM('available','reserved','completed','rejected') DEFAULT 'available',\r\n  lat DECIMAL(10,8) NULL,          -- ละติจูดของพิกัดแจกของ (สำหรับของแจกฟรี)\r\n  lng DECIMAL(11,8) NULL,          -- ลองจิจูดของพิกัดแจกของ (สำหรับของแจกฟรี),");

if(!c.includes('lat DECIMAL(10,8)')) {
    c = c.replace(/status ENUM\('available','reserved','completed','rejected'\) DEFAULT 'available',/g, "status ENUM('available','reserved','completed','rejected') DEFAULT 'available',\n  lat DECIMAL(10,8) NULL,          -- ละติจูดของพิกัดแจกของ (สำหรับของแจกฟรี)\n  lng DECIMAL(11,8) NULL,          -- ลองจิจูดของพิกัดแจกของ (สำหรับของแจกฟรี),");
}
fs.writeFileSync('config/db-schema.sql', c, 'utf8');
