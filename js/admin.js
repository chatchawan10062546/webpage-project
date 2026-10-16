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
            { label: 'รอตรวจสอบ', value: summary.pendingItems, icon: 'bi-clock-history', view: 'pendingItems', badge: summary.pendingItems > 0 ? summary.pendingItems : null },
            { label: 'แจ้งปัญหา', value: summary.pendingReports, icon: 'bi-exclamation-circle', view: 'reports', badge: summary.pendingReports > 0 ? summary.pendingReports : null },
            { label: 'ธุรกรรมทั้งหมด', value: summary.transactions, icon: 'bi-credit-card', view: 'transactions' }
        ];
        
        summaryElement.innerHTML = cards.map(card => `
            <div class="col-sm-6 col-xl flex-fill">
                <button class="admin-stat admin-summary-card w-100 position-relative" data-admin-view="${card.view}" type="button">
                    ${card.badge ? `<span class="position-absolute top-0 end-0 m-2 badge rounded-pill bg-danger shadow-sm fs-6">${card.badge}</span>` : ''}
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
            const isGeneralProblem = !report.item_id && !report.reported_user_id;
            let reportedTarget = '';
            if (isGeneralProblem) {
                reportedTarget = '<span class="badge bg-warning-subtle text-warning-emphasis border border-warning px-2 py-1"><i class="bi bi-exclamation-triangle-fill me-1"></i>แจ้งปัญหาทั่วไป</span>';
            } else if (report.item_id) {
                reportedTarget = `สินค้า: <span class="fw-bold">${escapeHtml(report.item_title || 'ไม่ระบุ')}</span>`;
            } else if (report.reported_user_id) {
                reportedTarget = `ผู้ถูกรายงาน: <span class="text-danger fw-bold">${escapeHtml(report.reported_name)} (${escapeHtml(report.reported_email)})</span>`;
            }

            const isResolved = report.status === 'resolved';

            let actionButtons = '';
            if (isResolved) {
                actionButtons = '<span class="badge bg-success-subtle text-success border border-success px-3 py-2 fw-bold"><i class="bi bi-check-circle-fill me-1"></i>ดำเนินการเรียบร้อยแล้ว</span>';
            } else if (isGeneralProblem) {
                // สำหรับส่วนที่เป็น "แจ้งปัญหาทั่วไป" มี 2 ปุ่ม: แก้ไข กับ เพิกเฉย
                actionButtons = `
                    <button class="btn btn-success btn-sm resolve-report-btn fw-bold" data-report-id="${report.report_id}" type="button"><i class="bi bi-check-circle me-1"></i>แก้ไข</button>
                    <button class="btn btn-outline-secondary btn-sm resolve-report-btn fw-bold" data-report-id="${report.report_id}" type="button"><i class="bi bi-slash-circle me-1"></i>เพิกเฉย</button>
                `;
            } else {
                // สำหรับรายงานที่อยู่ในสินค้า เอาแบบเดิม
                actionButtons = `
                    ${report.reported_user_id ? `<button class="btn btn-outline-danger btn-sm ban-user-btn fw-bold" data-user-id="${report.reported_user_id}" data-report-id="${report.report_id}" type="button">🚫 แบนผู้ใช้</button>` : ''}
                    ${report.item_id ? `<button class="btn btn-outline-danger btn-sm reject-item-btn fw-bold" data-item-id="${report.item_id}" data-report-id="${report.report_id}" type="button">❌ ลบโพสต์</button>` : ''}
                    <button class="btn btn-success btn-sm resolve-report-btn fw-bold" data-report-id="${report.report_id}" type="button">✅ เพิกเฉย/แก้ไขแล้ว</button>
                `;
            }

            return `
            <article class="admin-report-row">
                <div class="admin-report-main">
                    <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
                        <div>${reportedTarget}</div>
                        <span class="badge ${isResolved ? 'text-bg-success' : 'text-bg-warning'}">${isResolved ? 'แก้ไขแล้ว' : 'รอตรวจสอบ'}</span>
                    </div>
                    <div class="small text-muted mb-2">ผู้แจ้ง: ${escapeHtml(report.reporter_name)} (${escapeHtml(report.reporter_email)})</div>
                    <p class="mb-0 border-start border-danger border-3 ps-2 text-dark">${escapeHtml(report.reason)}</p>
                </div>
                <div class="admin-report-actions d-flex flex-column align-items-end gap-2">
                    <small class="text-muted">${new Date(report.created_at).toLocaleDateString('th-TH')} ${new Date(report.created_at).toLocaleTimeString('th-TH')}</small>
                    <div class="d-flex gap-2">
                        ${actionButtons}
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
                    <button class="btn btn-danger btn-sm reject-item-btn" data-item-id="${item.item_id}">❌ ไม่อนุมัติ</button>
                </td>
            </tr>`));
    }

    function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ', 'จัดการ'], transactions.map(t => {
            const isCompleted = t.status === 'completed' || Boolean(t.admin_slip);
            const isReleased = t.status === 'released';
            const isShipped = t.status === 'shipped';
            
            // ตรวจสอบว่าส่งของเกิน 2 วันหรือไม่
            let isOver2Days = false;
            if (t.shipped_at) {
                const shippedDate = new Date(t.shipped_at);
                const diffHours = (new Date() - shippedDate) / (1000 * 60 * 60);
                if (diffHours >= 48) {
                    isOver2Days = true;
                }
            } else if (t.release_at && new Date(t.release_at) <= new Date()) {
                isOver2Days = true;
            }

            let statusBadge = '';
            if (isCompleted) {
                statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>โอนสำเร็จแล้ว</span>';
            } else if (isReleased) {
                statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>รอแอดมินโอนเงิน</span>';
            } else if (isShipped) {
                statusBadge = '<span class="badge bg-primary"><i class="bi bi-truck me-1"></i>จัดส่งแล้ว</span>';
            } else if (t.status === 'paid') {
                statusBadge = '<span class="badge bg-info text-dark">รอจัดส่ง</span>';
            } else if (t.status === 'cancelled') {
                statusBadge = '<span class="badge bg-danger">ยกเลิก</span>';
            } else {
                statusBadge = `<span class="badge bg-secondary">${escapeHtml(t.status)}</span>`;
            }

            let over2DaysWarning = '';
            if ((isReleased || isShipped) && isOver2Days && !isCompleted) {
                over2DaysWarning = `
                    <div class="badge bg-danger-subtle text-danger border border-danger mt-1 text-wrap text-start d-block" style="font-size: 0.72rem;">
                        <i class="bi bi-clock-history me-1"></i>ส่งของเกิน 2 วันแล้ว (ครบกำหนดปล่อยเงินให้อัตโนมัติ)
                    </div>
                `;
            }

            let actionHtml = '';
            if (isReleased || (isShipped && isOver2Days && !isCompleted)) {
                actionHtml = `<button class="btn btn-sm btn-success complete-tx-btn fw-bold" data-id="${t.trans_id}">💸 โอนเงินแล้ว</button>`;
            } else if (isCompleted) {
                const slipUrl = t.payment_reference || t.admin_slip;
                if (slipUrl) {
                    actionHtml = `<a href="${slipUrl}" target="_blank" class="btn btn-sm btn-outline-success py-1 px-2" style="font-size: 0.8rem;"><i class="bi bi-receipt me-1"></i>ดูสลิปโอนเงิน</a><span class="badge bg-success-subtle text-success border border-success ms-1"><i class="bi bi-check2-all me-1"></i>โอนสำเร็จแล้ว</span>`;
                } else {
                    actionHtml = `<span class="badge bg-success-subtle text-success border border-success"><i class="bi bi-check2-all me-1"></i>โอนสำเร็จแล้ว</span>`;
                }
            }

            return `<tr>
                <td>${escapeHtml(t.item_title)}</td>
                <td>${escapeHtml(t.giver_name)}</td>
                <td>${t.seller_promptpay ? `<span class="fw-bold text-success">${escapeHtml(t.seller_promptpay)}</span><br><small class="text-muted">${escapeHtml(t.seller_promptpay_name || '')}</small>` : '<span class="text-muted">-</span>'}</td>
                <td>${escapeHtml(t.receiver_name)}</td>
                <td>฿${Number(t.amount).toLocaleString()}</td>
                <td>${statusBadge}${over2DaysWarning}</td>
                <td>${actionHtml}</td>
            </tr>`;
        }));
    }

    async function loadDashboard() {
        try {
            const [summaryData, reportData] = await Promise.all([
                requestJson('/api/admin/summary'),
                requestJson(`/api/admin/reports${filterElement.value === 'all' ? '' : `?status=${filterElement.value}`}`)
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
        
        const data = await requestJson(`/api/admin/${endpoint}`);
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

    if (!document.getElementById('adminSlipModal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="adminSlipModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-wallet2 me-2"></i>อัปโหลดหลักฐานการโอนเงิน</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <p class="text-muted mb-4">กรุณาแนบสลิปการโอนเงินเข้าบัญชีพร้อมเพย์ของผู้ขาย เพื่อเป็นหลักฐานว่าแอดมินได้ทำการโอนเงินเรียบร้อยแล้ว</p>
                            <input type="hidden" id="adminSlipTxId">
                            <div class="mb-3">
                                <label class="form-label fw-bold">แนบสลิปโอนเงิน</label>
                                <input class="form-control form-control-lg border-2 shadow-sm" type="file" id="adminSlipUpload" accept="image/jpeg, image/png">
                            </div>
                            <button id="submitAdminSlipBtn" class="btn btn-success w-100 py-3 fw-bold shadow-sm rounded-pill mt-2">
                                <i class="bi bi-check-circle-fill me-2"></i>ยืนยันและอัปโหลดสลิป
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        document.getElementById('submitAdminSlipBtn').addEventListener('click', async () => {
            const txId = document.getElementById('adminSlipTxId').value;
            const fileInput = document.getElementById('adminSlipUpload');
            
            if (fileInput.files.length === 0) {
                alert('กรุณาแนบสลิปการโอนเงินก่อนกดยืนยัน');
                return;
            }

            const formData = new FormData();
            formData.append('slip', fileInput.files[0]);

            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const response = await fetch(`/api/admin/transactions/${txId}/complete`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                
                const data = await response.json();
                if (!data.success) throw new Error(data.message);
                
                alert('บันทึกการโอนเงินและอัปโหลดสลิปสำเร็จ');
                bootstrap.Modal.getInstance(document.getElementById('adminSlipModal')).hide();
                loadView('transactions');
                fileInput.value = ''; // clear input
            } catch (error) {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            }
        });
    }

    document.getElementById('adminTransactionsList').addEventListener('click', event => {
        if (event.target.classList.contains('complete-tx-btn')) {
            const txId = event.target.dataset.id;
            document.getElementById('adminSlipTxId').value = txId;
            const modal = new bootstrap.Modal(document.getElementById('adminSlipModal'));
            modal.show();
        }
    });

    document.getElementById('adminViewPendingItems').addEventListener('click', async event => {
        if (event.target.classList.contains('approve-item-btn')) {
            if (!confirm('ยืนยันอนุมัติสินค้านี้ให้แสดงบนเว็บใช่หรือไม่?')) return;
            const itemId = event.target.dataset.itemId;
            try {
                await requestJson(`/api/admin/items/${itemId}/approve`, { method: 'PATCH' });
                alert('อนุมัติสินค้าสำเร็จ');
                loadView('pendingItems');
                loadDashboard();
            } catch (err) { alert(err.message); }
        } else if (event.target.classList.contains('reject-item-btn')) {
            const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติโพสต์นี้ (ผู้โพสต์จะเห็นข้อความนี้):');
            if (reason === null) return;
            const itemId = event.target.dataset.itemId;
            try {
                await requestJson(`/api/admin/items/${itemId}/reject`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason })
                });
                alert('ไม่อนุมัติและบันทึกเหตุผลสำเร็จ');
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
                await requestJson(`/api/admin/reports/${resolveBtn.dataset.reportId}`, {
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
                await requestJson(`/api/admin/users/${banBtn.dataset.userId}/ban`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (banBtn.dataset.reportId) {
                    await requestJson(`/api/admin/reports/${banBtn.dataset.reportId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'resolved' })
                    });
                }
                alert('แบนบัญชีผู้ใช้และบันทึกรายงานสำเร็จ');
                loadDashboard();
            } catch (error) {
                banBtn.disabled = false;
                alert(error.message);
            }
        } else if (rejectBtn) {
            const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติโพสต์นี้ (ผู้โพสต์จะเห็นข้อความนี้):');
            if (reason === null) return; // User clicked cancel
            
            rejectBtn.disabled = true;
            try {
                await requestJson(`/api/admin/items/${rejectBtn.dataset.itemId}/reject`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason })
                });
                if (rejectBtn.dataset.reportId) {
                    await requestJson(`/api/admin/reports/${rejectBtn.dataset.reportId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'resolved' })
                    });
                }
                alert('ไม่อนุมัติโพสต์และบันทึกรายงานสำเร็จ');
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
