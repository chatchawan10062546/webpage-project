const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const regex = /<div class="modal-body p-4">[\s\S]*?<button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold" type="button">ยืนยันการชำระเงิน และอัปโหลดสลิป<\/button>\s*<\/div>/;

const newHtml = `<div class="modal-body p-0">
    <!-- ภาพแบบ Edge-to-edge -->
    <div class="position-relative">
        <img src="\\${item.images?.[0] || 'https://via.placeholder.com/600x300'}" class="w-100 object-fit-cover" style="height: 250px;" alt="">
        <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);">
            <h4 class="fw-bold text-white mb-0 text-truncate">\\${escapeHtml(item.title)}</h4>
        </div>
    </div>
    
    <div class="p-4">
        <!-- ราคา -->
        <div class="d-flex justify-content-between align-items-center mb-4 bg-light rounded-4 p-3 border">
            <span class="text-muted fw-bold">ยอดที่ต้องชำระ</span>
            <span class="text-success fw-bold fs-2 mb-0">฿\\${Number(amount).toLocaleString()}</span>
        </div>

        <!-- ขั้นตอน -->
        <div class="px-2 mb-2">
            <div class="d-flex justify-content-between position-relative mb-2">
                <div class="progress position-absolute top-50 start-0 w-100 translate-middle-y" style="height: 3px; z-index: 1;">
                    <div class="progress-bar bg-success" style="width: 20%"></div>
                </div>
                <div class="position-relative bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">1</div>
                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">2</div>
                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">3</div>
                <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border" style="width: 28px; height: 28px; z-index: 2; font-size: 0.85rem;">4</div>
            </div>
            <div class="d-flex justify-content-between small text-center" style="font-size: 0.7rem;">
                <div class="text-success fw-bold" style="width: 25%; margin-left: -10%;">ชำระเงิน</div>
                <div class="text-muted" style="width: 25%;">ระบบพักเงิน</div>
                <div class="text-muted" style="width: 25%;">คนขายส่งของ</div>
                <div class="text-muted" style="width: 25%; margin-right: -10%;">รับของแล้ว</div>
            </div>
        </div>

        <hr class="my-4 text-muted">

        <!-- สแกน QR -->
        <div class="text-center bg-light rounded-4 p-4 border mb-4 shadow-sm">
            <div class="fw-bold text-dark mb-3"><i class="bi bi-qr-code-scan me-2"></i>สแกนจ่ายผ่านบัญชีกองกลาง</div>
            <div class="bg-white p-2 d-inline-block rounded-4 shadow-sm mb-3">
                <img src="https://promptpay.io/0800000000/\\${amount}.png" class="img-fluid" style="max-width: 180px;" alt="QR Code กองกลาง">
            </div>
            <div class="small text-muted bg-white border rounded-pill py-1 px-3 d-inline-block">
                พร้อมเพย์: <span class="fw-bold text-dark">080-000-0000</span> (แอดมิน ปันสุข)
            </div>
        </div>
        
        <div class="alert alert-warning small border-0 shadow-sm d-flex align-items-center">
            <i class="bi bi-info-circle-fill text-warning fs-4 me-2"></i>
            <div>โหมดทดสอบ: ยังไม่มีการหักเงินจริง เงินจะถูกจำลองเป็นเงินพักในระบบเมื่อกดยืนยัน</div>
        </div>

        <div class="mb-4">
            <label class="form-label fw-bold text-dark"><i class="bi bi-receipt me-2"></i>แนบสลิปโอนเงิน</label>
            <input class="form-control form-control-lg border-2" type="file" id="slipUpload" accept="image/jpeg, image/png">
        </div>
        <button id="mockPayButton" class="btn btn-success w-100 py-3 fw-bold shadow-sm rounded-pill fs-5" type="button"><i class="bi bi-check-circle-fill me-2"></i>แจ้งชำระเงินเรียบร้อย</button>
    </div>
</div>`;

c = c.replace(regex, newHtml);

// Fix escape interpolation
c = c.replace(/\\\\\$/g, '$');

fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Polished the Escrow payment modal');
