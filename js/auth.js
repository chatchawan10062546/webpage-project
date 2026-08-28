// ====================================================
// 🔐 auth.js: ระบบสมาชิก (Login, Register, Toggle Password, Auth UI)
// โฟลเดอร์: js/auth.js
// ====================================================

// 📌 1. ประกาศตัวแปร Global ไว้บนสุดเพื่อให้ไฟล์อื่นเรียกใช้ได้
window.loginModal = null;

// ----------------------------------------------------
// 🎨 ฟังก์ชันจัดการการแสดงผลปุ่ม Navbar ตามสถานะล็อกอิน
// ----------------------------------------------------
function updateAuthUI() {
    const authNavContainer = document.getElementById('authNavContainer');
    if (!authNavContainer) return;

    // ดึงข้อมูลผู้ใช้จาก localStorage (ที่บันทึกไว้ตอน Login)
    const user = JSON.parse(localStorage.getItem('user'));
    
    // เช็ก ID แบบยืดหยุ่น รองรับทั้ง id, user_id, userId, _id
    const userId = user?.id || user?.user_id || user?.userId || user?._id;

    if (user && userId && localStorage.getItem('authToken')) {
        // 🟢 กรณีล็อกอินแล้ว: แสดงปุ่มรูปและชื่อโปรไฟล์
        authNavContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-light dropdown-toggle rounded-pill fw-bold text-success d-flex align-items-center gap-2 px-3 shadow-sm" type="button" data-bs-toggle="dropdown">
                    <img src="${user.avatar || 'https://via.placeholder.com/30'}" class="rounded-circle" width="28" height="28" style="object-fit: cover;">
                    <span>${user.name || 'สมาชิก'}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-3">
                    <li><a class="dropdown-item" href="#" id="profileOpenBtn">โปรไฟล์ของฉัน</a></li>
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
    const toggleIcon = document.getElementById('toggleIcon');

    if (togglePassword && regPassword && toggleIcon) {
        togglePassword.addEventListener('click', () => {
            const type = regPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            regPassword.setAttribute('type', type);
            toggleIcon.className = type === 'text' ? 'bi bi-eye' : 'bi bi-eye-slash';
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
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const phone = document.getElementById('regPhone').value;

            try {
                const response = await fetch('http://localhost:3000/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone })
                });

                const data = await response.json();

                if (data.success) {
                    const regModalElement = document.getElementById('registerModal');
                    if (regModalElement) {
                        const regModal = bootstrap.Modal.getInstance(regModalElement) || new bootstrap.Modal(regModalElement);
                        regModal.hide();
                    }

                    registerForm.reset();

                    const successModalElement = document.getElementById('regSuccessModal');
                    if (successModalElement) {
                        const successModal = new bootstrap.Modal(successModalElement);
                        successModal.show();
                    }
                } else {
                    alert('❌ ' + (data.message || 'ไม่สามารถสมัครสมาชิกได้'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
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
                const response = await fetch('http://localhost:3000/api/login', {
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
                    
                    location.reload();
                } else {
                    alert('❌ ' + data.message);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        });
    }
});