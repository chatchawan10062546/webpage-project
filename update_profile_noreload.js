const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8').split('\n');

const htmlStart = c.findIndex(l => l.includes('<div class="profile-form-heading fw-bold mb-3"><i class="bi bi-person-lines-fill me-2 text-success"></i>ข้อมูลส่วนตัว</div>'));
const htmlEnd = c.findIndex(l => l.includes('</form>')) + 1;

if (htmlStart > -1 && htmlEnd > -1) {
    const newHtml = [
        '                                    <div class="profile-form-heading fw-bold mb-3"><i class="bi bi-person-lines-fill me-2 text-success"></i>ข้อมูลส่วนตัว</div>',
        '                                    <div class="row g-3">',
        '                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profileName">ชื่อ</label><input id="profileName" class="form-control" value="${escapeHtml(profile.name)}" required ${profile.promptpay_number ? "disabled" : ""}></div>',
        '                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePhone">เบอร์โทรศัพท์</label><input id="profilePhone" class="form-control" value="${escapeHtml(profile.phone)}" ${profile.promptpay_number ? "disabled" : ""}></div>',
        '                                    </div>',
        '                                    <hr class="my-4">',
        '                                    <div class="profile-form-heading fw-bold mb-3"><i class="bi bi-wallet2 me-2 text-success"></i>ช่องทางรับเงิน (PromptPay)</div>',
        '                                    <div class="alert alert-info small py-2"><i class="bi bi-info-circle me-1"></i> ข้อมูลนี้จะเห็นเฉพาะคุณและแอดมินเท่านั้น สำหรับโอนเงินค่าสินค้า/เช่า</div>',
        '                                    <div class="row g-3">',
        '                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePromptpayNumber">เบอร์พร้อมเพย์</label><input id="profilePromptpayNumber" class="form-control" placeholder="เบอร์โทรหรือบัตรประชาชน" value="${escapeHtml(profile.promptpay_number)}" ${profile.promptpay_number ? "disabled" : ""}></div>',
        '                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePromptpayName">ชื่อบัญชีรับเงิน</label><input id="profilePromptpayName" class="form-control" placeholder="ชื่อ-นามสกุล ตรงตามบัญชี" value="${escapeHtml(profile.promptpay_name)}" ${profile.promptpay_number ? "disabled" : ""}></div>',
        '                                    </div>',
        '                                    <div class="small text-muted mt-2">อีเมล: ${escapeHtml(profile.email)}</div>',
        '                                    <div id="profileActionButtons" class="mt-3">',
        '                                        <button class="btn btn-warning rounded-pill px-4 fw-bold text-dark ${profile.promptpay_number ? "" : "d-none"}" type="button" id="editProfileBtn"><i class="bi bi-pencil-square me-2"></i>แก้ไขข้อมูล</button>',
        '                                        <button class="btn btn-success rounded-pill px-4 fw-bold ${profile.promptpay_number ? "d-none" : ""}" type="submit" id="saveProfileBtn"><i class="bi bi-save me-2"></i>บันทึกข้อมูล</button>',
        '                                    </div>',
        '                                </form>'
    ].join('\n');
    c.splice(htmlStart, htmlEnd - htmlStart, newHtml);
}

const logicStart = c.findIndex(l => l.includes("const pForm = document.getElementById('profileForm');"));
const logicEnd = c.findIndex(l => l.includes("} catch (error) {") && c[l-1].includes("});") && c[l-2].includes("}"));

if (logicStart > -1 && logicEnd > -1) {
    const newLogic = [
        "            const pForm = document.getElementById('profileForm');",
        "            const editBtn = document.getElementById('editProfileBtn');",
        "            const saveBtn = document.getElementById('saveProfileBtn');",
        "",
        "            if (editBtn) {",
        "                editBtn.addEventListener('click', () => {",
        "                    document.getElementById('profileName').disabled = false;",
        "                    document.getElementById('profilePhone').disabled = false;",
        "                    document.getElementById('profilePromptpayNumber').disabled = false;",
        "                    document.getElementById('profilePromptpayName').disabled = false;",
        "                    editBtn.classList.add('d-none');",
        "                    saveBtn.classList.remove('d-none');",
        "                });",
        "            }",
        "",
        "            if (pForm) pForm.addEventListener('submit', async event => {",
        "                event.preventDefault();",
        "                try {",
        "                    const updatedName = document.getElementById('profileName').value;",
        "                    const updatedPhone = document.getElementById('profilePhone').value;",
        "                    const updatedPromptpayNumber = document.getElementById('profilePromptpayNumber').value;",
        "                    const updatedPromptpayName = document.getElementById('profilePromptpayName').value;",
        "",
        "                    const result = await requestJson('/api/profile', {",
        "                        method: 'PUT',",
        "                        headers: { 'Content-Type': 'application/json' },",
        "                        body: JSON.stringify({ ",
        "                            user_id: userId, ",
        "                            name: updatedName, ",
        "                            phone: updatedPhone,",
        "                            promptpay_number: updatedPromptpayNumber,",
        "                            promptpay_name: updatedPromptpayName",
        "                        })",
        "                    });",
        "",
        "                    const storedUser = getUser();",
        "                    localStorage.setItem('user', JSON.stringify({ ",
        "                        ...storedUser, ",
        "                        name: result.profile.name, ",
        "                        phone: result.profile.phone, ",
        "                        promptpay_number: result.profile.promptpay_number, ",
        "                        promptpay_name: result.profile.promptpay_name ",
        "                    }));",
        "",
        "                    alert('บันทึกโปรไฟล์และพร้อมเพย์สำเร็จ');",
        "                    document.getElementById('profileName').disabled = true;",
        "                    document.getElementById('profilePhone').disabled = true;",
        "                    document.getElementById('profilePromptpayNumber').disabled = true;",
        "                    document.getElementById('profilePromptpayName').disabled = true;",
        "                    saveBtn.classList.add('d-none');",
        "                    if(editBtn) editBtn.classList.remove('d-none');",
        "                    ",
        "                    // Update header name if necessary",
        "                    document.querySelector('.profile-header h4').innerText = result.profile.name;",
        "                } catch (error) {",
        "                    alert('บันทึกโปรไฟล์ไม่สำเร็จ: ' + error.message);",
        "                }",
        "            });"
    ].join('\n');
    c.splice(logicStart, logicEnd - logicStart, newLogic);
}

fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
console.log('Fixed profile.js without reload');
