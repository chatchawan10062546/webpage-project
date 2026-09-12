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

    document.getElementById('adminUserName').textContent = user.name || 'ผู้ดูแลระบบ';
    document.getElementById('adminUserEmail').textContent = user.email || 'admin';
    document.getElementById('adminAccountName').textContent = user.name || 'ผู้ดูแลระบบ';
    document.getElementById('adminAccountEmail').textContent = user.email || 'admin';

    const summaryElement = document.getElementById('adminSummary');
    const reportsElement = document.getElementById('adminReportsList');
    const filterElement = document.getElementById('reportStatusFilter');
    document.getElementById('adminDateLabel').textContent = `วันนี้ ${new Date().toLocaleDateString('th-TH')}`;
    const viewElements = {
        reports: document.getElementById('adminViewReports'),
        users: document.getElementById('adminViewUsers'),
        items: document.getElementById('adminViewItems'),
        pendingItems: document.getElementById('adminViewPendingItems'),
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
            { label: 'ผู้ใช้ทั้งหมด', value: summary.users, icon: 'bi-people', view: 'users' },
            { label: 'รายการสินค้า', value: summary.items, icon: 'bi-box-seam', view: 'items' },
            { label: 'รอตรวจสอบ', value: summary.pendingItems, icon: 'bi-clock-history', view: 'pendingItems' },
            { label: 'แจ้งปัญหา', value: summary.pendingReports, icon: 'bi-exclamation-circle', view: 'reports' },
            { label: 'ธุรกรรมทั้งหมด', value: summary.transactions, icon: 'bi-credit-card', view: 'transactions' }
        ];
        
        summaryElement.innerHTML = cards.map(card => `
            <div class="col-sm-6 col-xl flex-fill">
                <button class="admin-stat admin-summary-card w-100" data-admin-view="${card.view}" type="button">
                    <i class="bi ${card.icon}"></i>
                    <div><div class="small text-muted">${card.label}</div><strong>${card.value}</strong></div>
                </button>
            </div>
        `).join('');
    }

    function renderReports(reports) {
        if (!reports.length) {
            reportsElement.innerHTML = '<div class="text-center text-muted py-5">ยังไม่มีรายงาน</div>';
            return;
        }
        reportsElement.innerHTML = reports.map(report => {
            const reportedTarget = report.reported_user_id 
                ? `ผู้ถูกรายงาน: <span class="text-danger fw-bold">${escapeHtml(report.reported_name)} (${escapeHtml(report.reported_email)})</span>` 
                : `สินค้า: <span class="fw-bold">${escapeHtml(report.item_title || 'ไม่ระบุ')}</span>`;
            
            return `
            <article class="admin-report-row">
                <div class="admin-report-main">
                    <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                        <div>${reportedTarget}</div>
                        <span class="badge ${report.status === 'pending' ? 'text-bg-warning' : 'text-bg-success'}">${report.status === 'pending' ? 'รอตรวจสอบ' : 'แก้ไขแล้ว'}</span>
                    </div>
                    <div class="small text-muted mb-2">ผู้แจ้ง: ${escapeHtml(report.reporter_name)} (${escapeHtml(report.reporter_email)})</div>
                    <p class="mb-0 border-start border-danger border-3 ps-2 text-dark">${escapeHtml(report.reason)}</p>
                </div>
                <div class="admin-report-actions d-flex flex-column align-items-end gap-2">
                    <small class="text-muted">${new Date(report.created_at).toLocaleDateString('th-TH')} ${new Date(report.created_at).toLocaleTimeString('th-TH')}</small>
                    <div class="d-flex gap-2">
                        ${report.reported_user_id ? `<button class="btn btn-outline-danger btn-sm ban-user-btn fw-bold" data-user-id="${report.reported_user_id}" type="button">🚫 แบนผู้ใช้</button>` : ''}
                        ${report.item_id ? `<button class="btn btn-outline-danger btn-sm reject-item-btn fw-bold" data-item-id="${report.item_id}" type="button">❌ ลบโพสต์</button>` : ''}
                        ${report.status === 'pending' ? `<button class="btn btn-success btn-sm resolve-report-btn" data-report-id="${report.report_id}" type="button">✅ เพิกเฉย/แก้ไขแล้ว</button>` : ''}
                    </div>
                </div>
            </article>
            `;
        }).join('');
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

    function renderPendingItems(items) {
        renderTable(document.getElementById('adminPendingItemsList'), ['สินค้า', 'รายละเอียด', 'ผู้โพสต์', 'จัดการ'], items.map(item => `
            <tr>
                <td>
                    <img src="${item.image_url}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                    <strong>${escapeHtml(item.title)}</strong>
                </td>
                <td><small class="text-muted">${escapeHtml(item.category)} • ${item.item_type === 'free' ? 'ฟรี' : `฿${Number(item.price).toLocaleString()}`}</small></td>
                <td>${escapeHtml(item.owner_name)}<div class="small text-muted">${escapeHtml(item.owner_email)}</div></td>
                <td>
                    <button class="btn btn-success btn-sm approve-item-btn" data-item-id="${item.item_id}">✅ อนุมัติ</button>
                    <button class="btn btn-danger btn-sm reject-item-btn" data-item-id="${item.item_id}">❌ ลบทิ้ง</button>
                </td>
            </tr>`));
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
        
        let endpoint = view;
        if (view === 'pendingItems') endpoint = 'items/pending';
        
        const data = await requestJson(`http://localhost:3000/api/admin/${endpoint}`);
        if (view === 'users') renderUsers(data.users);
        if (view === 'items') renderItems(data.items);
        if (view === 'pendingItems') renderPendingItems(data.items);
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

    document.getElementById('adminViewPendingItems').addEventListener('click', async event => {
        if (event.target.classList.contains('approve-item-btn')) {
            if (!confirm('ยืนยันอนุมัติสินค้านี้ให้แสดงบนเว็บใช่หรือไม่?')) return;
            const itemId = event.target.dataset.itemId;
            try {
                await requestJson(`http://localhost:3000/api/admin/items/${itemId}/approve`, { method: 'PATCH' });
                alert('อนุมัติสินค้าสำเร็จ');
                loadView('pendingItems');
                loadDashboard();
            } catch (err) { alert(err.message); }
        } else if (event.target.classList.contains('reject-item-btn')) {
            if (!confirm('ยืนยันลบสินค้านี้ทิ้งใช่หรือไม่?')) return;
            const itemId = event.target.dataset.itemId;
            try {
                await requestJson(`http://localhost:3000/api/admin/items/${itemId}/reject`, { method: 'DELETE' });
                alert('ปฏิเสธและลบสินค้าสำเร็จ');
                loadView('pendingItems');
                loadDashboard();
            } catch (err) { alert(err.message); }
        }
    });

    reportsElement.addEventListener('click', async event => {
        const resolveBtn = event.target.closest('.resolve-report-btn');
        const banBtn = event.target.closest('.ban-user-btn');
        const rejectBtn = event.target.closest('.reject-item-btn');

        if (resolveBtn) {
            resolveBtn.disabled = true;
            try {
                await requestJson(`http://localhost:3000/api/admin/reports/${resolveBtn.dataset.reportId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'resolved' })
                });
                loadDashboard();
            } catch (error) {
                resolveBtn.disabled = false;
                alert(error.message);
            }
        } else if (banBtn) {
            if (!confirm('ยืนยันที่จะแบนผู้ใช้นี้ใช่หรือไม่? (บัญชีนี้จะไม่สามารถเข้าสู่ระบบได้อีก)')) return;
            banBtn.disabled = true;
            try {
                await requestJson(`http://localhost:3000/api/admin/users/${banBtn.dataset.userId}/ban`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                alert('แบนบัญชีผู้ใช้สำเร็จ');
                loadDashboard();
            } catch (error) {
                banBtn.disabled = false;
                alert(error.message);
            }
        } else if (rejectBtn) {
            if (!confirm('ยืนยันที่จะลบโพสต์สินค้านี้ใช่หรือไม่?')) return;
            rejectBtn.disabled = true;
            try {
                await requestJson(`http://localhost:3000/api/admin/items/${rejectBtn.dataset.itemId}/reject`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                alert('ลบโพสต์สำเร็จ');
                loadDashboard();
            } catch (error) {
                rejectBtn.disabled = false;
                alert(error.message);
            }
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
