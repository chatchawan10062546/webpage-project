const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const regex = /const itemType = document\.querySelector\('input\[name="itemType"\]:checked'\)\?\.value \|\| 'free';/;
const replacement = `const itemType = document.querySelector('input[name="itemType"]:checked')?.value || 'free';
            
            // 📌 [Phase 2] ป้องกันการโพสต์ขาย/เช่า หากยังไม่ได้ตั้งค่าพร้อมเพย์
            if ((itemType === 'sell' || itemType === 'rent') && !user.promptpay_number) {
                alert('⚠️ ไม่สามารถลงประกาศได้! กรุณาตั้งค่า "เบอร์พร้อมเพย์" ในหน้า "โปรไฟล์ของฉัน" ก่อนทำการลงประกาศขายหรือให้เช่า เพื่อใช้สำหรับรับเงินครับ');
                return;
            }`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('js/item.js', c, 'utf8');
    console.log('Added Phase 2 validation to item.js');
} else {
    console.log('Failed to match item.js');
}
