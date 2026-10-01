const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8').split('\n');

const modalBodyStart = c.findIndex(l => l.includes('<div class="modal-body p-4">'));
const mockPayButton = c.findIndex((l, i) => i > modalBodyStart && l.includes('<button id="mockPayButton"'));
if (modalBodyStart > -1 && mockPayButton > -1) {
    const newHtml = [
        '                        <div class="modal-body p-0">',
        '                            <!-- ภาพแบบ Edge-to-edge -->',
        '                            <div class="position-relative">',
        '                                <img src="${item.images?.[0] || \'https://via.placeholder.com/600x300\'}" class="w-100 object-fit-cover" style="height: 280px;" alt="">',
        '                                <div class="position-absolute bottom-0 start-0 w-100 p-4" style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">',
        '                                    <h3 class="fw-bold text-white mb-0 text-truncate">${escapeHtml(item.title)}</h3>',
        '                                </div>',
        '                            </div>',
        '                            ',
        '                            <div class="p-4">',
        '                                <!-- ราคา -->',
        '                                <div class="d-flex justify-content-between align-items-center mb-4 bg-light rounded-4 p-4 border shadow-sm">',
        '                                    <span class="text-muted fw-bold fs-5">ยอดที่ต้องชำระ</span>',
        '                                    <span class="text-success fw-bold display-6 mb-0">฿${Number(amount).toLocaleString()}</span>',
        '                                </div>',
        '',
        '                                <!-- ขั้นตอน -->',
        '                                <div class="px-2 mb-3 mt-4">',
        '                                    <div class="d-flex justify-content-between position-relative mb-2">',
        '                                        <div class="progress position-absolute top-50 start-0 w-100 translate-middle-y" style="height: 4px; z-index: 1;">',
        '                                            <div class="progress-bar bg-success" style="width: 25%"></div>',
        '                                        </div>',
        '                                        <div class="position-relative bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">1</div>',
        '                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">2</div>',
        '                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">3</div>',
        '                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">4</div>',
        '                                    </div>',
        '                                    <div class="d-flex justify-content-between small text-center" style="font-size: 0.75rem;">',
        '                                        <div class="text-success fw-bold" style="width: 25%; margin-left: -10%;">ชำระเงิน</div>',
        '                                        <div class="text-muted" style="width: 25%;">ระบบพักเงิน</div>',
        '                                        <div class="text-muted" style="width: 25%;">คนขายส่งของ</div>',
        '                                        <div class="text-muted" style="width: 25%; margin-right: -10%;">รับของแล้ว</div>',
        '                                    </div>',
        '                                </div>',
        '',
        '                                <hr class="my-4 text-muted">',
        '',
        '                                <!-- สแกน QR -->',
        '                                <div class="text-center bg-light rounded-4 p-4 border mb-4 shadow-sm">',
        '                                    <div class="fw-bold text-dark mb-3 fs-5"><i class="bi bi-qr-code-scan me-2"></i>สแกนจ่ายผ่านบัญชีกองกลาง</div>',
        '                                    <div class="bg-white p-2 d-inline-block rounded-4 shadow-sm mb-3">',
        '                                        <img src="https://promptpay.io/0800000000/${amount}.png" class="img-fluid" style="max-width: 220px;" alt="QR Code กองกลาง">',
        '                                    </div>',
        '                                    <div class="text-muted bg-white border rounded-pill py-2 px-4 d-inline-block shadow-sm">',
        '                                        พร้อมเพย์: <span class="fw-bold text-dark fs-5 ms-1">080-000-0000</span> (แอดมิน ปันสุข)',
        '                                    </div>',
        '                                </div>',
        '                                ',
        '                                <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center rounded-4 mb-4">',
        '                                    <i class="bi bi-info-circle-fill text-warning fs-3 me-3"></i>',
        '                                    <div><strong>โหมดทดสอบ:</strong> ยังไม่มีการหักเงินจริง เงินจะถูกจำลองเป็นเงินพักในระบบเมื่อกดยืนยัน</div>',
        '                                </div>',
        '',
        '                                <div class="mb-4">',
        '                                    <label class="form-label fw-bold text-dark"><i class="bi bi-receipt me-2"></i>แนบหลักฐานการโอนเงิน (สลิป)</label>',
        '                                    <input class="form-control form-control-lg border-2 shadow-sm" type="file" id="slipUpload" accept="image/jpeg, image/png">',
        '                                </div>',
        '                                <button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold shadow-sm rounded-pill fs-5" type="button"><i class="bi bi-check-circle-fill me-2"></i>ยืนยันการชำระเงิน และอัปโหลดสลิป</button>'
    ].join('\n');

    c.splice(modalBodyStart, mockPayButton - modalBodyStart + 1, newHtml);
    fs.writeFileSync('js/transactions.js', c.join('\n'), 'utf8');
    console.log('Successfully replaced modal UI');
} else {
    console.log('Could not find boundaries');
}
