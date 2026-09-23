const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');

const search = "${!item.is_approved ? '<span class=\"badge text-bg-warning ms-2\">รอตรวจสอบ</span>' : ''}";
const replace = "${!item.is_approved ? (item.status === 'rejected' ? '<span class=\"badge text-bg-danger ms-2\">ไม่อนุมัติ</span>' : '<span class=\"badge text-bg-warning ms-2\">รอตรวจสอบ</span>') : ''}";

if (c.includes(search)) {
    c = c.replace(search, replace);
    fs.writeFileSync('js/profile.js', c, 'utf8');
    console.log('Fixed profile.js badge logic');
} else {
    console.log('Could not find search string');
}
