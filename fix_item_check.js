const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8').split('\n');

const checkStart = c.findIndex(l => l.includes("if ((itemType === 'sell' || itemType === 'rent') && !user.promptpay_number) {"));
if (checkStart > -1) {
    const newCheck = [
        "            // 📌 ดึงข้อมูลจากเซิร์ฟเวอร์โดยตรงเพื่อความชัวร์ (แก้ปัญหา LocalStorage ไม่ยอมอัปเดต)",
        "            if (itemType === 'sell' || itemType === 'rent') {",
        "                try {",
        "                    const profileRes = await fetch(`/api/profile?user_id=${userId}`, {",
        "                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }",
        "                    });",
        "                    const profileData = await profileRes.json();",
        "                    if (profileData.success && !profileData.profile.promptpay_number) {",
        "                        alert('⚠️ ไม่สามารถลงประกาศได้! กรุณาตั้งค่า \"เบอร์พร้อมเพย์\" ในหน้า \"โปรไฟล์ของฉัน\" ก่อนทำการลงประกาศขายหรือให้เช่า เพื่อใช้สำหรับรับเงินครับ');",
        "                        return;",
        "                    }",
        "                } catch (err) {",
        "                    console.error('Failed to verify promptpay', err);",
        "                }",
        "            }"
    ].join('\n');
    
    // replace 4 lines
    c.splice(checkStart, 4, newCheck);
    fs.writeFileSync('js/item.js', c.join('\n'), 'utf8');
    console.log('Fixed js/item.js to use API check');
}
