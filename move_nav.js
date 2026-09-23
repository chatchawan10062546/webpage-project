const fs = require('fs');

// 1. Update webpage.html
let html = fs.readFileSync('webpage.html', 'utf8');

const notifBlock = `<li class="nav-item dropdown">
                        <a class="nav-link" href="#" id="notifDropdownToggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            🔔 แจ้งเตือน <span class="badge bg-danger rounded-pill" id="notifBadge" style="display:none;">0</span>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="notifDropdownToggle" id="notifDropdownMenu" style="width: 320px; max-height: 400px; overflow-y: auto;">
                            <li><h6 class="dropdown-header d-flex justify-content-between align-items-center">
                                การแจ้งเตือน
                                <button class="btn btn-sm btn-link text-decoration-none" id="markAllReadBtn">อ่านทั้งหมด</button>
                            </h6></li>
                            <div id="notifList">
                                <li><span class="dropdown-item text-muted text-center">กำลังโหลด...</span></li>
                            </div>
                        </ul>
                    </li>`;

if (html.includes(notifBlock)) {
    html = html.replace(notifBlock, ''); // Remove from old spot
}

const reportContainer = '<li class="nav-item" id="reportNavContainer"></li>';
const newLayout = `${reportContainer}
                    ${notifBlock}
                    <li class="nav-item d-none" id="myRequestsNavContainer"><a class="nav-link" href="#" id="myRequestsOpenBtn">คำขอของฉัน</a></li>`;

if (!html.includes('myRequestsNavContainer')) {
    html = html.replace(reportContainer, newLayout);
    fs.writeFileSync('webpage.html', html, 'utf8');
}


// 2. Update js/userProfile.js (Remove คำขอของฉัน from dropdown, and show navbar item)
let upjs = fs.readFileSync('js/userProfile.js', 'utf8');
const reqDrop = `                    <li>
                        <a class="dropdown-item" href="#" id="myRequestsOpenBtn"><i class="bi bi-send me-2"></i>คำขอของฉัน</a>
                    </li>`;
if (upjs.includes(reqDrop)) {
    upjs = upjs.replace(reqDrop, '');
}
// Show navbar item if logged in
const showNav = `        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.remove('d-none');`;
if (!upjs.includes("myReqNav.classList.remove")) {
    upjs = upjs.replace('authNavContainer.innerHTML = `', showNav + '\n        authNavContainer.innerHTML = `');
}
const hideNav = `        const myReqNav = document.getElementById('myRequestsNavContainer');
        if (myReqNav) myReqNav.classList.add('d-none');`;
if (!upjs.includes("myReqNav.classList.add")) {
    upjs = upjs.replace('if (reportNavContainer) reportNavContainer.innerHTML', hideNav + '\n        if (reportNavContainer) reportNavContainer.innerHTML');
}
fs.writeFileSync('js/userProfile.js', upjs, 'utf8');

// 3. Update js/auth.js (Do the same, in case auth.js updates the UI before userProfile.js overrides it)
let authjs = fs.readFileSync('js/auth.js', 'utf8');
if (authjs.includes(reqDrop)) {
    authjs = authjs.replace(reqDrop, '');
}
if (!authjs.includes("myReqNav.classList.remove")) {
    authjs = authjs.replace('authNavContainer.innerHTML = `', showNav + '\n        authNavContainer.innerHTML = `');
}
if (!authjs.includes("myReqNav.classList.add")) {
    authjs = authjs.replace('if (reportNavContainer) reportNavContainer.innerHTML', hideNav + '\n        if (reportNavContainer) reportNavContainer.innerHTML');
}
fs.writeFileSync('js/auth.js', authjs, 'utf8');

console.log('Moved notifications and my requests');
