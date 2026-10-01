const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const targetHTML = `<button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold" type="button">ยืนยันการชำระเงินจำลอง</button>`;
const newHTML = `
    <!-- แทนที่ปุ่ม Mock ด้วย QR Code จำลองของกองกลาง และช่องอัปโหลดสลิป -->
    <div class="text-center mb-3">
        <p class="fw-bold mb-1">สแกนจ่ายเพื่อชำระเงิน (บัญชีกองกลาง)</p>
        <img src="https://promptpay.io/0800000000/\${amount}.png" class="img-fluid border rounded p-2 mb-2" style="max-width: 200px;" alt="QR Code กองกลาง">
        <div class="small text-muted">พร้อมเพย์: 080-000-0000 (แอดมิน ปันสุข)</div>
    </div>
    <div class="mb-3">
        <label class="form-label fw-bold">แนบหลักฐานการโอนเงิน (สลิป)</label>
        <input class="form-control" type="file" id="slipUpload" accept="image/jpeg, image/png">
    </div>
    <button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold" type="button">ยืนยันการชำระเงิน และอัปโหลดสลิป</button>
`;

if (c.includes(targetHTML)) {
    c = c.replace(targetHTML, newHTML);
    fs.writeFileSync('js/transactions.js', c, 'utf8');
    console.log('Updated Payment Modal UI in transactions.js');
} else {
    console.log('Failed to find mockPayButton in transactions.js');
}
