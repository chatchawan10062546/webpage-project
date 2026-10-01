const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const regex = /<div class="modal-body p-0">[\s\S]*?<button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold" type="button">ยืนยันการชำระเงิน และอัปโหลดสลิป<\/button>\s*<\/div>/;

const newHtml = '<div class="modal-body p-0">\n' +
'    <!-- ภาพแบบ Edge-to-edge -->\n' +
'    <div class="position-relative">\n' +
'        <img src="${item.images?.[0] || \'https://via.placeholder.com/600x300\'}" class="w-100 object-fit-cover" style="height: 250px;" alt="">\n' +
'        <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">\n' +
'            <h4 class="fw-bold text-white mb-0 text-truncate">${escapeHtml(item.title)}</h4>\n' +
'        </div>\n' +
'    </div>\n' +
'    \n' +
'    <div class="p-4">\n' +
'        <!-- ราคา -->\n' +
'        <div class="d-flex justify-content-between align-items-center mb-4 bg-light rounded-4 p-3 border">\n' +
'            <span class="text-muted fw-bold">ยอดที่ต้องชำระ</span>\n' +
'            <span class="text-success fw-bold fs-2 mb-0">฿${Number(amount).toLocaleString()}</span>\n' +
'        </div>\n' +
'\n' +
'        <!-- ขั้นตอน -->\n' +
'        <div class="px-2 mb-2">\n' +
'            <div class="d-flex justify-content-between position-relative mb-2">\n' +
'                <div class="progress position-absolute top-50 start-0 w-100 translate-middle-y" style="height: 3px; z-index: 1;">\n' +
'                    <div class="progress-bar bg-success" style="width: 20%"></div>\n' +
'                </div>\n' +
'                <div class="position-relative bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">1</div>\n' +
'                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">2</div>\n' +
'                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">3</div>\n' +
'                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">4</div>\n' +
'            </div>\n' +
'            <div class="d-flex justify-content-between small text-center" style="font-size: 0.7rem;">\n' +
'                <div class="text-success fw-bold" style="width: 25%; margin-left: -10%;">ชำระเงิน</div>\n' +
'                <div class="text-muted" style="width: 25%;">ระบบพักเงิน</div>\n' +
'                <div class="text-muted" style="width: 25%;">คนขายส่งของ</div>\n' +
'                <div class="text-muted" style="width: 25%; margin-right: -10%;">รับของแล้ว</div>\n' +
'            </div>\n' +
'        </div>\n' +
'\n' +
'        <hr class="my-4 text-muted">\n' +
'\n' +
'        <!-- สแกน QR -->\n' +
'        <div class="text-center bg-light rounded-4 p-4 border mb-4 shadow-sm">\n' +
'            <div class="fw-bold text-dark mb-3"><i class="bi bi-qr-code-scan me-2"></i>สแกนจ่ายผ่านบัญชีกองกลาง</div>\n' +
'            <div class="bg-white p-2 d-inline-block rounded-4 shadow-sm mb-3">\n' +
'                <img src="https://promptpay.io/0800000000/${amount}.png" class="img-fluid" style="max-width: 180px;" alt="QR Code กองกลาง">\n' +
'            </div>\n' +
'            <div class="small text-muted bg-white border rounded-pill py-1 px-3 d-inline-block">\n' +
'                พร้อมเพย์: <span class="fw-bold text-dark">080-000-0000</span> (แอดมิน ปันสุข)\n' +
'            </div>\n' +
'        </div>\n' +
'        \n' +
'        <div class="alert alert-warning small border-0 shadow-sm d-flex align-items-center">\n' +
'            <i class="bi bi-info-circle-fill text-warning fs-4 me-2"></i>\n' +
'            <div>โหมดทดสอบ: ยังไม่มีการหักเงินจริง เงินจะถูกจำลองเป็นเงินพักในระบบเมื่อกดยืนยัน</div>\n' +
'        </div>\n' +
'\n' +
'        <div class="mb-4">\n' +
'            <label class="form-label fw-bold text-dark"><i class="bi bi-receipt me-2"></i>แนบสลิปโอนเงิน</label>\n' +
'            <input class="form-control form-control-lg border-2" type="file" id="slipUpload" accept="image/jpeg, image/png">\n' +
'        </div>\n' +
'        <button id="mockPayButton" class="btn btn-success w-100 py-3 fw-bold shadow-sm rounded-pill fs-5" type="button"><i class="bi bi-check-circle-fill me-2"></i>แจ้งชำระเงินเรียบร้อย</button>\n' +
'    </div>\n' +
'</div>';

c = c.replace(regex, newHtml);

fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Polished the Escrow payment modal using pure strings');
