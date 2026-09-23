const fs = require('fs');
let c = fs.readFileSync('js/mySales.js', 'utf8');

const regex = /return `[\s\n]*<div class="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden my-sale-card" data-item-id="\${sale\.item_id}">/m;
const replace = `let rejectedBanner = '';
                if (sale.status === 'rejected' || sale.is_approved === 0 || sale.is_approved === false) {
                    rejectedBanner = \`
                    <div class="alert alert-danger m-3 d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                        <div>
                            <strong>โพสต์นี้ไม่ผ่านการอนุมัติ (แอดมินปฏิเสธ)</strong><br>
                            เหตุผล: \${sale.rejection_reason || 'ไม่ระบุเหตุผล / ผิดกฎของแพลตฟอร์ม'}
                        </div>
                    </div>\`;
                }

                return \`
                    <div class="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden my-sale-card" data-item-id="\${sale.item_id}">\${rejectedBanner}`;

if (regex.test(c)) {
    c = c.replace(regex, replace);
    fs.writeFileSync('js/mySales.js', c, 'utf8');
    console.log('Modified mySales.js successfully');
} else {
    console.log('Regex failed');
}
