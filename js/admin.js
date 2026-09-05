// ====================================================
// 🛡️ admin.js : dashboard หลังบ้านสำหรับ admin
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || user?.role !== 'admin') {
        alert('ไม่มีสิทธิ์เข้าหลังบ้าน');
        window.location.href = 'webpage.html';
        return;
    }

    const summaryElement = document.getElementById('adminSummary');
    const reportsElement = document.getElementById('adminReportsList');
    const filterElement = document.getElementById('reportStatusFilter');
    const viewElements = {
        reports: document.getElementById('adminViewReports'),
        users: document.getElementById('adminViewUsers'),
        items: document.getElementById('adminViewItems'),
        transactions: document.getElementById('adminViewTransactions')
    };

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    function renderSummary(summary) {
        const cards = [
            ['ผู้ใช้ทั้งหมด', summary.users, 'bi-people'],
            ['รายการสินค้า', summary.items, 'bi-box-seam'],
            ['รายงานรอตรวจสอบ', summary.pendingReports, 'bi-exclamation-circle'],
            ['ธุรกรรมทั้งหมด', summary.transactions, 'bi-credit-card']
        ];
        summaryElement.innerHTML = cards.map(([label, value, icon]) => `
            <div class="col-sm-6 col-xl-3"><button class="admin-stat admin-summary-card" data-admin-view="${['users', 'items', 'reports', 'transactions'][cards.findIndex(card => card[0] === label)]}" type="button"><i class="bi ${icon}"></i><div><div class="small text-muted">${label}</div><strong>${value}</strong></div></button></div>
        `).join('');
    }

    function renderReports(reports) {
        if (!reports.length) {
            reportsElement.innerHTML = '<div class="text-center text-muted py-5">ยังไม่มีรายงาน</div>';
            return;
        }
        reportsElement.innerHTML = reports.map(report => `
            <article class="admin-report-row">
                <div class="admin-report-main">
                    <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                        <strong>${escapeHtml(report.item_title)}</strong>
                        <span class="badge ${report.status === 'pending' ? 'text-bg-warning' : 'text-bg-success'}">${report.status === 'pending' ? 'รอตรวจสอบ' : 'แก้ไขแล้ว'}</span>
                    </div>
                    <div class="small text-muted mb-2">ผู้แจ้ง: ${escapeHtml(report.reporter_name)} (${escapeHtml(report.reporter_email)})</div>
                    <p class="mb-0">${escapeHtml(report.reason)}</p>
                </div>
                <div class="admin-report-actions">
                    <small class="text-muted">${new Date(report.created_at).toLocaleDateString('th-TH')}</small>
                    ${report.status === 'pending' ? `<button class="btn btn-success btn-sm resolve-report-btn" data-report-id="${report.report_id}" type="button">ทำเครื่องหมายว่าแก้ไขแล้ว</button>` : ''}
                </div>
            </article>
        `).join('');
    }

    function renderTable(container, headers, rows) {
        container.innerHTML = rows.length ? `<div class="table-responsive"><table class="table admin-table align-middle"><thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<div class="text-center text-muted py-5">ยังไม่มีข้อมูล</div>';
    }

    function renderUsers(users) {
        renderTable(document.getElementById('adminUsersList'), ['ID', 'ชื่อ', 'อีเมล', 'โทรศัพท์', 'สิทธิ์', 'วันที่สมัคร'], users.map(user => `<tr><td>${user.user_id}</td><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.phone)}</td><td><span class="badge ${user.role === 'admin' ? 'text-bg-success' : 'text-bg-secondary'}">${user.role}</span></td><td>${new Date(user.created_at).toLocaleDateString('th-TH')}</td></tr>`));
    }

    function renderItems(items) {
        renderTable(document.getElementById('adminItemsList'), ['สินค้า', 'เจ้าของ', 'ประเภท', 'ราคา', 'สถานะ', 'วันที่'], items.map(item => `<tr><td><strong>${escapeHtml(item.title)}</strong><div class="small text-muted">${escapeHtml(item.category)}</div></td><td>${escapeHtml(item.owner_name)}<div class="small text-muted">${escapeHtml(item.owner_email)}</div></td><td>${item.item_type}</td><td>${item.item_type === 'free' ? 'ฟรี' : `฿${Number(item.price).toLocaleString()}`}</td><td>${item.status}</td><td>${new Date(item.created_at).toLocaleDateString('th-TH')}</td></tr>`));
    }

    function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'ธุรกรรม', 'ชำระเงิน', 'จัดส่ง'], transactions.map(transaction => `<tr><td>${escapeHtml(transaction.item_title)}</td><td>${escapeHtml(transaction.giver_name)}</td><td>${escapeHtml(transaction.receiver_name)}</td><td>฿${Number(transaction.amount).toLocaleString()}</td><td>${transaction.status}</td><td>${transaction.payment_status}</td><td>${transaction.shipping_status}</td></tr>`));
    }

    async function loadDashboard() {
        try {
            const [summaryData, reportData] = await Promise.all([
                requestJson('http://localhost:3000/api/admin/summary'),
                requestJson(`http://localhost:3000/api/admin/reports${filterElement.value === 'all' ? '' : `?status=${filterElement.value}`}`)
            ]);
            renderSummary(summaryData.summary);
            renderReports(reportData.reports);
        } catch (error) {
            reportsElement.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`;
        }
    }

    async function loadView(view) {
        if (view === 'reports') return loadDashboard();
        const data = await requestJson(`http://localhost:3000/api/admin/${view}`);
        if (view === 'users') renderUsers(data.users);
        if (view === 'items') renderItems(data.items);
        if (view === 'transactions') renderTransactions(data.transactions);
    }

    async function switchView(view) {
        Object.entries(viewElements).forEach(([key, element]) => element.classList.toggle('d-none', key !== view));
        try { await loadView(view); } catch (error) { viewElements[view].innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`; }
    }

    summaryElement.addEventListener('click', event => {
        const card = event.target.closest('.admin-summary-card');
        if (card) switchView(card.dataset.adminView);
    });

    reportsElement.addEventListener('click', async event => {
        const button = event.target.closest('.resolve-report-btn');
        if (!button) return;
        button.disabled = true;
        try {
            await requestJson(`http://localhost:3000/api/admin/reports/${button.dataset.reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'resolved' })
            });
            loadDashboard();
        } catch (error) {
            button.disabled = false;
            alert(error.message);
        }
    });

    filterElement.addEventListener('change', loadDashboard);
    document.getElementById('refreshReportsBtn').addEventListener('click', loadDashboard);
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        window.location.href = 'webpage.html';
    });
    loadDashboard();
});
