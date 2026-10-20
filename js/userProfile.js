// ====================================================
// 👤 userProfile.js : จัดการการแสดงผล UI รูปโปรไฟล์วงกลม
// โฟลเดอร์: js/userProfile.js
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    updateProfileUI();
});

function updateProfileUI() {
    const userJson = localStorage.getItem('user');
    const authContainer = document.getElementById('authNavContainer');
    const reportNavContainer = document.getElementById('reportNavContainer');

    if (!authContainer) return;

    if (userJson && localStorage.getItem('authToken')) {
        const user = JSON.parse(userJson);
        // บังคับแอดมินให้อยู่หน้า admin.html
        if (user.role === 'admin' && (window.location.pathname.endsWith('webpage.html') || window.location.pathname.endsWith('/'))) {
            window.location.replace('admin.html');
            return;
        }
        const userId = user.id || user.user_id || user.userId || user._id;

        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.remove('d-none');
        const mySalesNav = document.getElementById('mySalesNavContainer');
        if (mySalesNav) mySalesNav.classList.remove('d-none');
        const myTxNav = document.getElementById('myTransactionsNavContainer');
        if (myTxNav) myTxNav.classList.remove('d-none');

        if (!userId) {
            authContainer.innerHTML = `
                <button class="btn btn-light text-success fw-bold px-4 rounded-pill shadow-sm"
                    data-bs-toggle="modal" data-bs-target="#loginModal">เข้าสู่ระบบ</button>
            `;
            return;
        }
        
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
                        <a class="dropdown-item" href="#" id="profileOpenBtn"><i class="bi bi-person me-2"></i>โปรไฟล์ของฉัน</a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>รายการที่ฉันประกาศ</a>
                    </li>

                    ${user.role === 'admin' ? '<li><a class="dropdown-item fw-bold text-success" href="admin.html"><i class="bi bi-speedometer2 me-2"></i>หลังบ้านแอดมิน</a></li>' : ''}
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                        <a class="dropdown-item text-secondary" href="#" id="reportProblemBtn">
                            <i class="bi bi-exclamation-triangle me-2 text-warning"></i>แจ้งปัญหา / ช่วยเหลือ
                        </a>
                    </li>
                    <li>
                        <button class="dropdown-item text-danger mt-1" onclick="logoutUser()">
                            <i class="bi bi-box-arrow-right me-2"></i>ออกจากระบบ
                        </button>
                    </li>
                </ul>
            </div>
        `;

        if (typeof window.updateTransactionsBadge === 'function') {
            window.updateTransactionsBadge();
        }
        if (typeof window.updateAllNavBadges === 'function') {
            window.updateAllNavBadges();
        }
    } else {
        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.add('d-none');
        const mySalesNav = document.getElementById('mySalesNavContainer');
        if (mySalesNav) mySalesNav.classList.add('d-none');
        const myTxNav = document.getElementById('myTransactionsNavContainer');
        if (myTxNav) myTxNav.classList.add('d-none');
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
    localStorage.removeItem('authToken');
    location.reload();
}

document.addEventListener('click', e => {
    if (e.target.closest('#myTransactionsOpenBtn') || e.target.closest('#myTransactionsNavBtn')) {
        e.preventDefault();
        if (typeof window.openMyTransactionsModal === 'function') window.openMyTransactionsModal();
    }
    if (e.target.closest('#myListingsOpenBtn')) {
        e.preventDefault();
        if (typeof window.switchFeedMode === 'function') {
            window.switchFeedMode('my_listings');
        }
    }
});
