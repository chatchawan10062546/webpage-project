// ====================================================
// 🔐 auth.js: ระบบสมาชิก (Login, Register, Toggle Password, Auth UI, Google)
// โฟลเดอร์: js/auth.js
// ====================================================

// 📌 1. ประกาศตัวแปร Global ไว้บนสุดเพื่อให้ไฟล์อื่นเรียกใช้ได้
window.loginModal = null;

// Callback สำหรับ Google Identity Services
window.handleCredentialResponse = async (response) => {
    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ credential: response.credential })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('authToken', data.token);
            const extractedId = data.user.id || data.user.user_id || data.user.userId || data.user.ID;
            const userData = { ...data.user, id: extractedId, user_id: extractedId };
            localStorage.setItem('user', JSON.stringify(userData));
            
            if (window.loginModal) window.loginModal.hide();
            
            if (userData.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                location.reload();
            }
        } else {
            alert('❌ ' + data.message);
        }
    } catch (error) {
        console.error('Google Auth Error:', error);
        alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
};

// ----------------------------------------------------
// 🎨 ฟังก์ชันจัดการการแสดงผลปุ่ม Navbar ตามสถานะล็อกอิน
// ----------------------------------------------------
function updateAuthUI() {
    const authNavContainer = document.getElementById('authNavContainer');
    const reportNavContainer = document.getElementById('reportNavContainer');
    if (!authNavContainer) return;

    // ดึงข้อมูลผู้ใช้จาก localStorage (ที่บันทึกไว้ตอน Login)
    const user = JSON.parse(localStorage.getItem('user'));
    
    // เช็ก ID แบบยืดหยุ่น รองรับทั้ง id, user_id, userId, _id
    const userId = user?.id || user?.user_id || user?.userId || user?._id;

    if (user && userId && localStorage.getItem('authToken')) {
        if (reportNavContainer) {
            reportNavContainer.innerHTML = '<a class="nav-link" href="#" id="reportProblemBtn">แจ้งปัญหา</a>';
        }
        // 🟢 กรณีล็อกอินแล้ว: แสดงปุ่มรูปและชื่อโปรไฟล์
                const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.remove('d-none');
        const mySalesNav = document.getElementById('mySalesNavContainer');
        if (mySalesNav) mySalesNav.classList.remove('d-none');
        authNavContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light dropdown-toggle rounded-pill fw-bold text-success d-flex align-items-center gap-2 px-3 shadow-sm" type="button" data-bs-toggle="dropdown">
                    <img src="${user.avatar || 'https://via.placeholder.com/30'}" class="rounded-circle" width="28" height="28" style="object-fit: cover;">
                    <span>${user.name || 'สมาชิก'}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    <li><a class="dropdown-item" href="#" id="profileOpenBtn">👤 โปรไฟล์ของฉัน</a></li>

                    ${user.role === 'admin' ? '<li><a class="dropdown-item fw-bold text-success" href="admin.html">หลังบ้านแอดมิน</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger fw-bold" href="#" id="logoutBtn">ออกจากระบบ</a></li>
                </ul>
            </div>
        `;

        // ผูก Event ให้ปุ่ม "ออกจากระบบ"
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user'); // ลบข้อมูล Logged in
                localStorage.removeItem('authToken');
                location.reload(); // รีโหลดหน้าเพื่อกลับสู่สถานะยังไม่ได้ล็อกอิน
            });
        }
    } else {
                const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.add('d-none');
        const mySalesNav = document.getElementById('mySalesNavContainer');
        if (mySalesNav) mySalesNav.classList.add('d-none');
        if (reportNavContainer) reportNavContainer.innerHTML = '';
        // 🔴 กรณีที่ยังไม่ได้ล็อกอิน: แสดงปุ่มเข้าสู่ระบบ
        authNavContainer.innerHTML = `
            <button class="btn btn-light text-success fw-bold px-4 rounded-pill shadow-sm"
                data-bs-toggle="modal" data-bs-target="#loginModal">เข้าสู่ระบบ</button>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // 📌 2. เรียกใช้ฟังก์ชันอัปเดตปุ่ม Navbar ทันทีที่โหลดหน้าเว็บ
    updateAuthUI();

    // 📌 3. ผูก Instance ของ Modal เข้ากับ window.loginModal
    const loginModalElement = document.getElementById('loginModal');
    if (loginModalElement) {
        window.loginModal = new bootstrap.Modal(loginModalElement);
    }

    // ----------------------------------------------------
    // 👁️ 1. ปุ่มเปิด-ปิดตา ดูรหัสผ่าน (หน้า สมัครสมาชิก)
    // ----------------------------------------------------
    const togglePassword = document.getElementById('togglePassword');
    const regPassword = document.getElementById('regPassword');
    const togglePasswordText = document.getElementById('togglePasswordText');

    if (togglePassword && regPassword) {
        togglePassword.addEventListener('click', () => {
            const isPassword = regPassword.getAttribute('type') === 'password';
            regPassword.setAttribute('type', isPassword ? 'text' : 'password');
            if (togglePasswordText) {
                togglePasswordText.textContent = isPassword ? 'ซ่อน' : 'แสดง';
            }
        });
    }

    // ----------------------------------------------------
    // 🛡️ ตรวจสอบเงื่อนไขรหัสผ่าน 5 ข้อแบบ Real-time
    // ----------------------------------------------------
    function checkPasswordCriteria(pwd) {
        return {
            hasLength: (pwd || '').length >= 6,
            hasUpper: /[A-Z]/.test(pwd || ''),
            hasLower: /[a-z]/.test(pwd || ''),
            hasNumber: /[0-9]/.test(pwd || ''),
            hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd || '')
        };
    }

    function updatePasswordRequirementsUI(pwd) {
        const criteria = checkPasswordCriteria(pwd);
        
        function updateItem(elId, isValid) {
            const el = document.getElementById(elId);
            if (!el) return;
            const icon = el.querySelector('i');
            if (isValid) {
                el.classList.remove('text-danger');
                el.classList.add('text-success');
                if (icon) {
                    icon.className = 'bi bi-check-lg fw-bold text-success';
                }
            } else {
                el.classList.remove('text-success');
                el.classList.add('text-danger');
                if (icon) {
                    icon.className = 'bi bi-x-lg fw-bold text-danger';
                }
            }
        }

        updateItem('ruleLength', criteria.hasLength);
        updateItem('ruleUpper', criteria.hasUpper);
        updateItem('ruleLower', criteria.hasLower);
        updateItem('ruleNumber', criteria.hasNumber);
        updateItem('ruleSpecial', criteria.hasSpecial);

        return criteria.hasLength && criteria.hasUpper && criteria.hasLower && criteria.hasNumber && criteria.hasSpecial;
    }

    if (regPassword) {
        regPassword.addEventListener('input', (e) => {
            updatePasswordRequirementsUI(e.target.value);
        });
    }

    const registerModalEl = document.getElementById('registerModal');
    if (registerModalEl) {
        registerModalEl.addEventListener('show.bs.modal', () => {
            if (regPassword) updatePasswordRequirementsUI(regPassword.value);
        });
    }

    // ----------------------------------------------------
    // 👁️ 2. ปุ่มเปิด-ปิดตา ดูรหัสผ่าน (หน้า เข้าสู่ระบบ)
    // ----------------------------------------------------
    const toggleLoginPassword = document.getElementById('toggleLoginPassword');
    const loginPassword = document.getElementById('loginPassword');
    const toggleLoginIcon = document.getElementById('toggleLoginIcon');

    if (toggleLoginPassword && loginPassword && toggleLoginIcon) {
        toggleLoginPassword.addEventListener('click', () => {
            const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPassword.setAttribute('type', type);
            toggleLoginIcon.className = type === 'text' ? 'bi bi-eye' : 'bi bi-eye-slash';
        });
    }

    // ----------------------------------------------------
    // 🔥 3. ระบบสมัครสมาชิก (ส่งข้อมูลเข้า Database ผ่าน API)
    // ----------------------------------------------------
    const registerForm = document.getElementById('registerForm');

    // สลับส่วนกรอก พร้อมเพย์ / บัญชีธนาคารในหน้าสมัครสมาชิก
    const regPayoutPromptpay = document.getElementById('regPayoutPromptpay');
    const regPayoutBank = document.getElementById('regPayoutBank');
    const regPromptpaySection = document.getElementById('regPromptpaySection');
    const regBankSection = document.getElementById('regBankSection');

    if (regPayoutPromptpay && regPayoutBank) {
        regPayoutPromptpay.addEventListener('change', () => {
            if (regPayoutPromptpay.checked) {
                regPromptpaySection?.classList.remove('d-none');
                regBankSection?.classList.add('d-none');
            }
        });
        regPayoutBank.addEventListener('change', () => {
            if (regPayoutBank.checked) {
                regPromptpaySection?.classList.add('d-none');
                regBankSection?.classList.remove('d-none');
            }
        });
    }

    // ปุ่มดึงชื่อและเบอร์โทรศัพท์มาใส่ในช่องพร้อมเพย์อัตโนมัติ
    const btnAutoFillPromptPay = document.getElementById('btnAutoFillPromptPay');
    if (btnAutoFillPromptPay) {
        btnAutoFillPromptPay.addEventListener('click', () => {
            const nameVal = document.getElementById('regName')?.value.trim() || '';
            const phoneVal = document.getElementById('regPhone')?.value.trim() || '';
            
            if (nameVal) {
                const nameInput = document.getElementById('regPromptpayName');
                if (nameInput) nameInput.value = nameVal;
            }
            if (phoneVal) {
                const phoneInput = document.getElementById('regPromptpayNumber');
                if (phoneInput) phoneInput.value = phoneVal;
            }
            if (!nameVal && !phoneVal) {
                alert('กรุณากรอกชื่อ-นามสกุล และเบอร์โทรศัพท์ด้านบนก่อนกดปุ่มนี้ครับ');
            } else {
                btnAutoFillPromptPay.innerHTML = '<i class="bi bi-check-circle-fill text-success me-1"></i>ดึงข้อมูลเรียบร้อย';
                setTimeout(() => {
                    btnAutoFillPromptPay.innerHTML = '<i class="bi bi-magic me-1"></i>ใช้ชื่อและเบอร์โทรที่กรอกไว้ด้านบน';
                }, 2000);
            }
        });
    }

    // ปุ่มดึงชื่อมาใส่ในช่องชื่อบัญชีธนาคารอัตโนมัติ
    const btnAutoFillBankName = document.getElementById('btnAutoFillBankName');
    if (btnAutoFillBankName) {
        btnAutoFillBankName.addEventListener('click', () => {
            const nameVal = document.getElementById('regName')?.value.trim() || '';
            if (nameVal) {
                const bankNameInput = document.getElementById('regBankAccountName');
                if (bankNameInput) bankNameInput.value = nameVal;
                btnAutoFillBankName.innerHTML = '<i class="bi bi-check-circle-fill text-success me-1"></i>ดึงชื่อเรียบร้อย';
                setTimeout(() => {
                    btnAutoFillBankName.innerHTML = '<i class="bi bi-magic me-1"></i>ใช้ชื่อที่กรอกไว้ด้านบน';
                }, 2000);
            } else {
                alert('กรุณากรอกชื่อ-นามสกุลด้านบนก่อนกดปุ่มนี้ครับ');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังสมัครสมาชิก...';
            }

            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const phone = document.getElementById('regPhone').value;

            const allValid = updatePasswordRequirementsUI(password);
            if (!allValid) {
                alert('กรุณาตั้งรหัสผ่านให้ครบตามเงื่อนไขทั้ง 5 ข้อที่กำหนดครับ');
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
                return;
            }

            const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
            if (!cleanPhone || cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) {
                alert('กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง 10 หลัก (เช่น 0812345678)');
                const phoneInput = document.getElementById('regPhone');
                if (phoneInput) phoneInput.focus();
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
                return;
            }

            // ข้อมูลช่องทางรับเงิน (ระบบคนกลาง)
            const payoutTypeRadio = document.querySelector('input[name="regPayoutType"]:checked');
            const payout_type = payoutTypeRadio ? payoutTypeRadio.value : 'promptpay';
            const promptpay_number = document.getElementById('regPromptpayNumber')?.value.trim() || '';
            const promptpay_name = document.getElementById('regPromptpayName')?.value.trim() || '';
            const bank_name = document.getElementById('regBankName')?.value || '';
            const bank_account = document.getElementById('regBankAccount')?.value.trim() || '';
            const bank_account_name = document.getElementById('regBankAccountName')?.value.trim() || '';

            if (payout_type === 'promptpay') {
                if (!promptpay_number || !promptpay_name) {
                    alert('กรุณากรอกเบอร์พร้อมเพย์และชื่อบัญชี หรือกดปุ่ม "ใช้ชื่อและเบอร์โทรที่กรอกไว้ด้านบน" ครับ');
                    document.getElementById('regPromptpayNumber')?.focus();
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
                    return;
                }
            } else {
                if (!bank_name || !bank_account || !bank_account_name) {
                    alert('กรุณาเลือกธนาคาร ระบุเลขที่บัญชี และชื่อเจ้าของบัญชีให้ครบถ้วนครับ');
                    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
                    return;
                }
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        phone: cleanPhone,
                        payout_type,
                        promptpay_number,
                        promptpay_name,
                        bank_name,
                        bank_account,
                        bank_account_name
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const regModalElement = document.getElementById('registerModal');
                    if (regModalElement) {
                        const regModal = bootstrap.Modal.getInstance(regModalElement);
                        if (regModal) regModal.hide();
                    }

                    registerForm.reset();

                    // เปิด OTP Modal หลังจาก Modal สมัครปิดเรียบร้อยแล้ว
                    setTimeout(() => {
                        const otpModalElement = document.getElementById('otpModal');
                        if (otpModalElement) {
                            document.getElementById('otpEmailHidden').value = data.email || email;
                            
                            const otpHint = document.getElementById('otpDevHint');
                            if (otpHint) {
                                if (data.emailSent) {
                                    otpHint.innerHTML = '<div class="alert alert-success py-2 small mb-3">✅ ส่งรหัส OTP ไปยังอีเมล <strong>' + (data.email || email) + '</strong> แล้ว กรุณาตรวจสอบในกล่องจดหมาย</div>';
                                } else if (data.otp) {
                                    otpHint.innerHTML = '<div class="alert alert-warning py-2 small mb-3 text-start"><div class="fw-bold mb-1">💡 รหัส OTP สำหรับทดสอบในเครื่อง:</div><div class="fs-4 text-center fw-bold text-dark my-1 bg-white rounded p-1 border">' + data.otp + '</div><div class="text-muted" style="font-size: 0.78rem;">(ระบบกรอกให้เรียบร้อยแล้ว หรือดูได้จากหน้าจอ Terminal)</div></div>';
                                }
                            }

                            // กรอกรหัสให้อัตโนมัติหากอยู่ในโหมดทดสอบ
                            const otpInput = document.getElementById('otpCode');
                            if (otpInput) {
                                if (data.otp && !data.emailSent) {
                                    otpInput.value = data.otp;
                                } else {
                                    otpInput.value = '';
                                }
                                otpInput.focus();
                            }

                            const otpModal = bootstrap.Modal.getOrCreateInstance(otpModalElement);
                            otpModal.show();
                        }
                    }, 200);
                } else {
                    alert('❌ ' + (data.message || 'ไม่สามารถสมัครสมาชิกได้'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }

    // ----------------------------------------------------
    // 🔁 3.5 ระบบส่งรหัส OTP ใหม่อีกครั้ง (Resend OTP)
    // ----------------------------------------------------
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const resendTimerText = document.getElementById('resendTimerText');
    const resendSeconds = document.getElementById('resendSeconds');
    let countdownInterval = null;

    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async () => {
            const email = document.getElementById('otpEmailHidden')?.value;
            if (!email) return alert('ไม่พบอีเมลสำหรับส่งรหัส OTP กรุณากรอกสมัครสมาชิกใหม่');

            const originalBtnHtml = resendOtpBtn.innerHTML;
            resendOtpBtn.disabled = true;
            resendOtpBtn.classList.add('text-muted');
            resendOtpBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>กำลังส่ง...';

            try {
                const response = await fetch('/api/resend-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();

                if (data.success) {
                    const otpHint = document.getElementById('otpDevHint');
                    if (otpHint) {
                        if (data.emailSent) {
                            otpHint.innerHTML = '<div class="alert alert-success py-2 small mb-3">✅ ส่งรหัส OTP ใหม่ไปยังอีเมล <strong>' + email + '</strong> เรียบร้อยแล้ว</div>';
                        } else if (data.otp) {
                            otpHint.innerHTML = '<div class="alert alert-warning py-2 small mb-3 text-start"><div class="fw-bold mb-1">💡 รหัส OTP ใหม่:</div><div class="fs-4 text-center fw-bold text-dark my-1 bg-white rounded p-1 border">' + data.otp + '</div></div>';
                        }
                    }

                    const otpInput = document.getElementById('otpCode');
                    if (otpInput && data.otp && !data.emailSent) {
                        otpInput.value = data.otp;
                    }

                    // เริ่มนับถอยหลัง 60 วินาที
                    let seconds = 60;
                    if (resendTimerText && resendSeconds) {
                        resendTimerText.classList.remove('d-none');
                        resendSeconds.innerText = seconds;

                        clearInterval(countdownInterval);
                        countdownInterval = setInterval(() => {
                            seconds--;
                            resendSeconds.innerText = seconds;
                            if (seconds <= 0) {
                                clearInterval(countdownInterval);
                                resendOtpBtn.disabled = false;
                                resendOtpBtn.classList.remove('text-muted');
                                resendTimerText.classList.add('d-none');
                            }
                        }, 1000);
                    }
                } else {
                    alert('❌ ' + (data.message || 'ส่งรหัส OTP ไม่สำเร็จ'));
                    resendOtpBtn.disabled = false;
                    resendOtpBtn.classList.remove('text-muted');
                }
            } catch (err) {
                console.error('Resend OTP Error:', err);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
                resendOtpBtn.disabled = false;
                resendOtpBtn.classList.remove('text-muted');
            } finally {
                resendOtpBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // ----------------------------------------------------
// 🔥 4. ระบบเข้าสู่ระบบ (ส่งข้อมูลเข้า Database ผ่าน API)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('authToken', data.token);
                    // ดึง ID ออกมาจากข้อมูลที่ Backend ส่งมา
                    const extractedId = data.user.id || data.user.user_id || data.user.userId || data.user.ID;

                    const userData = {
                        ...data.user,
                        id: extractedId,
                        user_id: extractedId
                    };

                    // บันทึกลง localStorage
                    localStorage.setItem('user', JSON.stringify(userData));

                    if (window.loginModal) window.loginModal.hide();
                    loginForm.reset();

                    if (userData.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        location.reload();
                    }
                } else {
                    if (data.requires_otp) {
                        alert('⚠️ ' + data.message);
                        if (window.loginModal) window.loginModal.hide();
                        const otpModalElement = document.getElementById('otpModal');
                        if (otpModalElement) {
                            document.getElementById('otpEmailHidden').value = data.email || email;
                            const otpModal = new bootstrap.Modal(otpModalElement);
                            otpModal.show();
                        }
                    } else {
                        alert('❌ ' + data.message);
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        });
    }

    // ----------------------------------------------------
    // 🔥 5. ระบบยืนยัน OTP
    const otpForm = document.getElementById('otpForm');
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('otpEmailHidden').value;
            const otp = document.getElementById('otpCode').value;

            try {
                const response = await fetch('/api/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp })
                });

                const data = await response.json();

                if (data.success) {
                    localStorage.setItem('authToken', data.token);
                    const extractedId = data.user.id || data.user.user_id || data.user.userId || data.user.ID;
                    const userData = { ...data.user, id: extractedId, user_id: extractedId };
                    localStorage.setItem('user', JSON.stringify(userData));

                    alert('✅ ยืนยันอีเมลสำเร็จ!');
                    location.reload();
                } else {
                    alert('❌ ' + data.message);
                }
            } catch (error) {
                console.error('OTP Error:', error);
                alert('⚠️ เกิดข้อผิดพลาดในการตรวจสอบรหัส');
            }
        });
    }
});

// Auth Guards for interactive elements
window.handlePostItemClick = function(event) {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนลงประกาศแจกของครับ');
        window.openLoginModal();
    } else {
        const postModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('postItemModal'));
        postModal.show();
    }
};

    // ----------------------------------------------------
    // 🔥 ระบบลืมรหัสผ่าน
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value.trim();
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.disabled = true;
            submitBtn.innerText = 'กำลังส่ง...';

            try {
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว');
                    forgotPasswordForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
                } else {
                    alert(data.message || 'ไม่พบอีเมลนี้ในระบบ');
                }
            } catch (error) {
                console.error(error);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        });
    }

    // ----------------------------------------------------
    // 🔥 ตรวจสอบ URL เพื่อเปิด Modal ตั้งรหัสผ่านใหม่
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    
    if (resetToken) {
        // รอให้ Modal โหลดเสร็จแล้วค่อยเปิด
        setTimeout(() => {
            const resetModal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
            document.getElementById('resetTokenHidden').value = resetToken;
            resetModal.show();
            
            // ลบ query string ออกจาก URL เพื่อความสวยงาม
            window.history.replaceState({}, document.title, window.location.pathname);
        }, 500);
    }

    // 🔥 ระบบตั้งรหัสผ่านใหม่
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('resetTokenHidden').value;
            const newPassword = document.getElementById('resetNewPassword').value;
            const confirmPassword = document.getElementById('resetConfirmPassword').value;

            if (newPassword !== confirmPassword) {
                return alert('รหัสผ่านและการยืนยันไม่ตรงกัน');
            }

            try {
                const response = await fetch('/api/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const data = await response.json();
                
                if (data.success) {
                    alert(data.message || 'เปลี่ยนรหัสผ่านสำเร็จ');
                    bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal')).hide();
                    
                    // เปิดหน้าต่าง Login
                    setTimeout(() => {
                        new bootstrap.Modal(document.getElementById('loginModal')).show();
                    }, 500);
                } else {
                    alert(data.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
                }
            } catch (error) {
                console.error(error);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            }
        });
    }
window.togglePasswordVisibility = function(inputId, iconId) { const input = document.getElementById(inputId); const icon = document.getElementById(iconId); if (input && icon) { const type = input.getAttribute('type') === 'password' ? 'text' : 'password'; input.setAttribute('type', type); icon.className = type === 'text' ? 'bi bi-eye' : 'bi bi-eye-slash'; } };
