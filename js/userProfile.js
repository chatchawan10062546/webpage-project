// ====================================================
// 👤 userProfile.js : จัดการการแสดงผล UI รูปโปรไฟล์วงกลม
// โฟลเดอร์: js/userProfile.js
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

function updateAuthUI() {
    const userJson = localStorage.getItem('user');
    const authContainer = document.getElementById('authNavContainer');

    if (!authContainer) return;

    if (userJson) {
        const user = JSON.parse(userJson);
        
        // เช็กว่าผู้ใช้มีรูปโปรไฟล์หรือไม่ (ถ้ามีใช้รูป ถ้าไม่มีใช้ไอคอน)
        const avatarHtml = user.avatar_url 
            ? `<div class="profile-avatar-circle"><img src="${user.avatar_url}" alt="Profile"></div>`
            : `<div class="profile-avatar-circle"><i class="bi bi-person-fill"></i></div>`;

        authContainer.innerHTML = `
            <div class="dropdown d-inline-block">
                <button class="btn user-profile-btn dropdown-toggle d-flex align-items-center gap-2" 
                        type="button" id="userMenu" data-bs-toggle="dropdown" aria-expanded="false">
                    ${avatarHtml}
                    <span class="user-profile-name">${user.name || 'ผู้ใช้งาน'}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="userMenu">
                    <li class="px-3 py-2 border-bottom">
                        <div class="fw-bold text-dark">${user.name || ''}</div>
                        <small class="text-muted">${user.email || ''}</small>
                    </li>
                    <li>
                        <button class="dropdown-item text-danger mt-1" onclick="logoutUser()">
                            <i class="bi bi-box-arrow-right me-2"></i>ออกจากระบบ
                        </button>
                    </li>
                </ul>
            </div>
        `;
    } else {
        // ✅ แก้ไขตรงนี้: เปลี่ยนเป็นปุ่มสีขาว ขอบมน ตัวหนังสือสีเขียว (btn-light text-success fw-bold)
        authContainer.innerHTML = `
            <button class="btn btn-light text-success fw-bold px-4 rounded-pill shadow-sm" 
                    data-bs-toggle="modal" data-bs-target="#loginModal">
                เข้าสู่ระบบ
            </button>
        `;
    }
}

function logoutUser() {
    localStorage.removeItem('user');
    location.reload();
}