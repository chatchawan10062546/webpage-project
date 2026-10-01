const fs = require('fs');
let c = fs.readFileSync('js/itemManagement.js', 'utf8');

const regex = /event\.preventDefault\(\);/;
const replacement = `event.preventDefault();
        
        // 📌 [Phase 2] ป้องกันการแก้ไขเป็นขาย/เช่า หากยังไม่ได้ตั้งค่าพร้อมเพย์
        const user = getCurrentUser();
        const itemType = document.getElementById('editType').value;
        if ((itemType === 'sell' || itemType === 'rent') && (!user || !user.promptpay_number)) {
            alert('⚠️ ไม่สามารถบันทึกการแก้ไขได้! กรุณาตั้งค่า "เบอร์พร้อมเพย์" ในหน้า "โปรไฟล์ของฉัน" ก่อนทำการเปลี่ยนเป็นขายหรือให้เช่า เพื่อใช้สำหรับรับเงินครับ');
            return;
        }`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('js/itemManagement.js', c, 'utf8');
    console.log('Added Phase 2 validation to itemManagement.js');
} else {
    console.log('Failed to match itemManagement.js');
}
