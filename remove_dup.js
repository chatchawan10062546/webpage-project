const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const s = c.indexOf('// อัปเดตระยะทางเมื่อโหลดรายการเสร็จ');
if (s !== -1) {
    const e = c.indexOf('});\n', s) + 4;
    c = c.substring(0, s) + c.substring(e);
    fs.writeFileSync('js/item.js', c, 'utf8');
    console.log('Removed duplicate distance logic in item.js');
}
