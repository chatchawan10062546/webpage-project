const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');

c = c.replace(
    /<div class="col-md-6"><label class="form-label fw-semibold" for="profilePhone">เบอร์โทรศัพท์<\/label><input id="profilePhone" class="form-control" value="\$\{escapeHtml\(profile.phone\)}"><\/div>\s*<\/div>/,
    `<div class="col-md-6"><label class="form-label fw-semibold" for="profilePhone">เบอร์โทรศัพท์</label><input id="profilePhone" class="form-control" value="\${escapeHtml(profile.phone)}"></div>
                                    </div>
                                    <hr class="my-4">
                                    <div class="profile-form-heading fw-bold mb-3"><i class="bi bi-wallet2 me-2 text-success"></i>ช่องทางรับเงิน (PromptPay)</div>
                                    <div class="alert alert-info small py-2"><i class="bi bi-info-circle me-1"></i> ข้อมูลนี้จะเห็นเฉพาะคุณและแอดมินเท่านั้น สำหรับโอนเงินค่าสินค้า/เช่า</div>
                                    <div class="row g-3">
                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePromptpayNumber">เบอร์พร้อมเพย์</label><input id="profilePromptpayNumber" class="form-control" placeholder="เบอร์โทรหรือบัตรประชาชน" value="\${escapeHtml(profile.promptpay_number)}"></div>
                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePromptpayName">ชื่อบัญชีรับเงิน</label><input id="profilePromptpayName" class="form-control" placeholder="ชื่อ-นามสกุล ตรงตามบัญชี" value="\${escapeHtml(profile.promptpay_name)}"></div>
                                    </div>`
);

c = c.replace(
    /const updatedPhone = document.getElementById\('profilePhone'\)\.value;/,
    `const updatedPhone = document.getElementById('profilePhone').value;
                    const updatedPromptpayNumber = document.getElementById('profilePromptpayNumber').value;
                    const updatedPromptpayName = document.getElementById('profilePromptpayName').value;`
);

c = c.replace(
    /body: JSON.stringify\(\{ name: updatedName, phone: updatedPhone \}\)/,
    "body: JSON.stringify({ name: updatedName, phone: updatedPhone, promptpay_number: updatedPromptpayNumber, promptpay_name: updatedPromptpayName })"
);

fs.writeFileSync('js/profile.js', c, 'utf8');
console.log('Updated profile.js');
