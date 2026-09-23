const fs = require('fs');
let html = fs.readFileSync('webpage.html', 'utf8');

// 1. Add Bell Icon to Navbar (before chat)
const navItemSearch = `<li class="nav-item"><a class="nav-link" href="#" id="chatNavLink">แชตข้อความ</a></li>`;
const navItemReplace = `<li class="nav-item dropdown">
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
                    </li>
                    <li class="nav-item"><a class="nav-link" href="#" id="chatNavLink">แชตข้อความ</a></li>`;

if (!html.includes('id="notifDropdownToggle"')) {
    html = html.replace(navItemSearch, navItemReplace);
}

// 2. Import js/notifications.js
const scriptSearch = `<script src="js/auth.js?v=4"></script>`;
const scriptReplace = `<script src="js/auth.js?v=4"></script>
    <script src="js/notifications.js?v=1"></script>`;

if (!html.includes('js/notifications.js')) {
    html = html.replace(scriptSearch, scriptReplace);
}

fs.writeFileSync('webpage.html', html, 'utf8');
console.log("Injected notification UI into webpage.html");
