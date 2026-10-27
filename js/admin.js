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

    let cachedPendingItems = [];

    function renderPendingItems(items) {
        cachedPendingItems = items || [];
        renderTable(document.getElementById('adminPendingItemsList'), ['สินค้า', 'ประเภท / ราคา', 'หมวดหมู่ & รายละเอียด', 'ผู้โพสต์', 'จัดการ'], items.map(item => {
            const isRental = item.item_type === 'rent';
            const isSell = item.item_type === 'sell';
            
            let typeBadge = '';
            let priceCol = '';
            if (isRental) {
                typeBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-key-fill me-1"></i>ปล่อยเช่า</span>';
                priceCol = `
                    <div class="mt-1">
                        <strong class="text-success fs-6">฿${Number(item.price).toLocaleString()} / วัน</strong>
                        <div class="small text-primary fw-bold"><i class="bi bi-shield-lock me-1"></i>มัดจำ ฿${Number(item.deposit || 0).toLocaleString()}</div>
                    </div>
                `;
            } else if (isSell) {
                typeBadge = '<span class="badge bg-primary"><i class="bi bi-tag-fill me-1"></i>ขาย</span>';
                priceCol = `<div class="mt-1"><strong class="text-primary fs-6">฿${Number(item.price).toLocaleString()}</strong></div>`;
            } else {
                typeBadge = '<span class="badge bg-success"><i class="bi bi-gift-fill me-1"></i>ส่งต่อฟรี</span>';
                priceCol = '<div class="mt-1 text-muted small">ไม่มีค่าใช้จ่าย</div>';
            }

            const imgUrl = item.image_url || '/assets/pansuk_icon.jpg';

            const editBadge = item.is_edited 
                ? '<span class="badge bg-warning text-dark"><i class="bi bi-pencil-square me-1"></i>แก้ไขข้อมูล</span>' 
                : '<span class="badge bg-info-subtle text-info border border-info"><i class="bi bi-plus-circle me-1"></i>โพสต์ใหม่</span>';

            return `
            <tr>
                <td style="min-width: 200px;">
                    <div class="d-flex align-items-center gap-2">
                        <img src="${imgUrl}" alt="" style="width: 55px; height: 55px; object-fit: cover; border-radius: 8px; flex-shrink: 0;" class="border shadow-sm">
                        <div class="min-width-0">
                            <strong class="d-block text-truncate" style="max-width: 220px;">${escapeHtml(item.title)}</strong>
                            <div class="d-flex align-items-center gap-1 mt-1">
                                ${editBadge}
                                <small class="text-muted"><i class="bi bi-calendar3 me-1"></i>${new Date(item.created_at).toLocaleDateString('th-TH')}</small>
                            </div>
                        </div>
                    </div>
                </td>
                <td style="min-width: 140px;">
                    ${typeBadge}
                    ${priceCol}
                </td>
                <td style="min-width: 220px;">
                    <span class="badge bg-light text-dark border mb-1">${escapeHtml(item.category)}</span>
                    <p class="small text-muted mb-1 text-truncate" style="max-width: 240px;" title="${escapeHtml(item.description || '')}">${escapeHtml(item.description || 'ไม่มีรายละเอียด')}</p>
                    <small class="text-secondary d-block"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(item.location || 'ไม่ระบุพิกัด')}</small>
                </td>
                <td style="min-width: 160px;">
                    <strong>${escapeHtml(item.owner_name)}</strong>
                    <div class="small text-muted">${escapeHtml(item.owner_email)}</div>
                    ${item.owner_phone ? `<div class="small text-muted"><i class="bi bi-telephone me-1"></i>${escapeHtml(item.owner_phone)}</div>` : ''}
                </td>
                <td style="min-width: 170px;">
                    <div class="d-flex flex-column gap-1">
                        <button class="btn btn-outline-primary btn-sm inspect-item-btn fw-bold py-1" data-item-id="${item.item_id}" type="button">
                            <i class="bi bi-search me-1"></i>ตรวจดูโพสต์
                        </button>
                        <div class="d-flex gap-1">
                            <button class="btn btn-success btn-sm approve-item-btn fw-bold flex-fill py-1" data-item-id="${item.item_id}" type="button">
                                <i class="bi bi-check-lg me-1"></i>อนุมัติ
                            </button>
                            <button class="btn btn-outline-danger btn-sm reject-item-btn fw-bold flex-fill py-1" data-item-id="${item.item_id}" type="button">
                                <i class="bi bi-x-lg me-1"></i>ไม่อนุมัติ
                            </button>
                        </div>
                    </div>
                </td>
            </tr>`;
        }));
    }

    let currentAdminTransactions = [];

    function renderTransactions(transactions) {
        currentAdminTransactions = transactions;
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย / ให้เช่า', 'บัญชีรับเงิน (ผู้ขาย/ให้เช่า)', 'ผู้ซื้อ / ผู้เช่า', 'จำนวนเงิน', 'สถานะ', 'จัดการ'], transactions.map(t => {
            const isRental = t.item_type === 'rent';
            const isCompleted = t.status === 'completed' || Boolean(t.admin_slip);
            const isReleased = t.status === 'released';
            const isShipped = t.status === 'shipped';
            
            // ตรวจสอบว่าส่งของเกิน 2 วันหรือไม่ (เฉพาะซื้อขาด)
            let isOver2Days = false;
            if (!isRental) {
                if (t.shipped_at) {
                    const shippedDate = new Date(t.shipped_at);
                    const diffHours = (new Date() - shippedDate) / (1000 * 60 * 60);
                    if (diffHours >= 48) {
                        isOver2Days = true;
                    }
                } else if (t.release_at && new Date(t.release_at) <= new Date()) {
                    isOver2Days = true;
                }
            }

            let statusBadge = '';
            if (isCompleted) {
                statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>โอนสำเร็จแล้ว</span>';
                if (t.claim_admin_decision || t.claim_status === 'settled') {
                    statusBadge += `<div class="badge bg-info-subtle text-info-emphasis border border-info mt-1 text-wrap text-start d-block" style="font-size: 0.72rem;"><i class="bi bi-shield-check me-1"></i>ไกล่เกลี่ยแล้ว (หักชดเชย ฿${Number(t.claim_amount || 0).toLocaleString()})</div>`;
                }
            } else if (isRental && t.rental_status === 'damage_claimed') {
                let consentBadge = '';
                if (t.claim_status === 'accepted') {
                    consentBadge = '<span class="badge bg-success-subtle text-success border border-success d-block mt-1 text-wrap text-start" style="font-size: 0.72rem;"><i class="bi bi-check-circle-fill me-1"></i>ผู้เช่ายินยอมยอดหักแล้ว</span>';
                } else if (t.claim_status === 'rejected') {
                    consentBadge = '<span class="badge bg-danger-subtle text-danger border border-danger d-block mt-1 text-wrap text-start" style="font-size: 0.72rem;"><i class="bi bi-x-octagon-fill me-1"></i>ผู้เช่าไม่ยินยอม / ให้แอดมินตัดสิน</span>';
                } else {
                    consentBadge = '<span class="badge bg-warning-subtle text-dark border border-warning d-block mt-1 text-wrap text-start" style="font-size: 0.72rem;"><i class="bi bi-chat-dots-fill me-1"></i>กำลังเจรจา / รอผู้เช่าตอบ</span>';
                }
                statusBadge = `<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>พบของชำรุด / ขอหักมัดจำ</span>${consentBadge}`;
            } else if (isRental && (t.rental_status === 'returned' || isReleased)) {
                statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>คืนของแล้ว รอโอนค่าเช่า+คืนมัดจำ</span>';
            } else if (isRental && t.rental_status === 'returning') {
                statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-arrow-return-left me-1"></i>ส่งคืนแล้ว รอเจ้าของตรวจรับ</span>';
            } else if (isRental && (t.status === 'renting' || t.rental_status === 'renting')) {
                statusBadge = '<span class="badge bg-info text-dark"><i class="bi bi-clock-history me-1"></i>กำลังเช่า</span>';
            } else if (isReleased) {
                statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>รอแอดมินโอนเงิน</span>';
            } else if (isShipped) {
                statusBadge = '<span class="badge bg-primary"><i class="bi bi-truck me-1"></i>จัดส่ง / ส่งมอบแล้ว</span>';
            } else if (t.status === 'paid') {
                statusBadge = '<span class="badge bg-info text-dark">ชำระแล้ว (รอจัดส่ง)</span>';
            } else if (t.status === 'cancelled') {
                statusBadge = '<span class="badge bg-danger">ยกเลิก</span>';
            } else {
                statusBadge = `<span class="badge bg-secondary">${escapeHtml(t.status)}</span>`;
            }

            let over2DaysWarning = '';
            if (!isRental && (isReleased || isShipped) && isOver2Days && !isCompleted) {
                over2DaysWarning = `
                    <div class="badge bg-danger-subtle text-danger border border-danger mt-1 text-wrap text-start d-block" style="font-size: 0.72rem;">
                        <i class="bi bi-clock-history me-1"></i>ส่งของเกิน 2 วันแล้ว (ครบกำหนดปล่อยเงินให้อัตโนมัติ)
                    </div>
                `;
            }

            let actionHtml = '';
            if (isRental && t.rental_status === 'damage_claimed' && !isCompleted) {
                actionHtml = `<button class="btn btn-sm btn-warning text-dark settle-claim-btn fw-bold shadow-sm" data-id="${t.trans_id}"><i class="bi bi-hammer me-1"></i>ไกล่เกลี่ย / โอนมัดจำ</button>`;
            } else if (isReleased || (!isRental && isShipped && isOver2Days && !isCompleted) || (isRental && t.rental_status === 'returned' && !isCompleted)) {
                actionHtml = `<button class="btn btn-sm btn-success complete-tx-btn fw-bold" data-id="${t.trans_id}">💸 โอนเงินแล้ว</button>`;
            } else if (isCompleted) {
                let slips = '';
                if (t.admin_slip) {
                    slips += `<a href="${escapeHtml(t.admin_slip)}" target="_blank" class="btn btn-sm btn-outline-success py-1 px-2 d-inline-block me-1 mb-1" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>สลิปผู้ให้เช่า</a>`;
                }
                if (t.deposit_refund_slip) {
                    slips += `<a href="${escapeHtml(t.deposit_refund_slip)}" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2 d-inline-block me-1 mb-1" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>สลิปคืนมัดจำ</a>`;
                }
                if (!slips && (t.payment_reference || t.admin_slip)) {
                    const fallbackSlip = t.payment_reference || t.admin_slip;
                    slips = `<a href="${escapeHtml(fallbackSlip)}" target="_blank" class="btn btn-sm btn-outline-success py-1 px-2 d-inline-block me-1 mb-1" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>ดูสลิปโอนเงิน</a>`;
                }
                actionHtml = `${slips}<span class="badge bg-success-subtle text-success border border-success"><i class="bi bi-check2-all me-1"></i>โอนสำเร็จแล้ว</span>`;
            }

            // แสดงรายละเอียดของ
            let itemCol = `<div><strong>${escapeHtml(t.item_title)}</strong> ${isRental ? '<span class="badge bg-warning text-dark ms-1">🔑 ให้เช่า</span>' : '<span class="badge bg-info text-dark ms-1">🏷️ ขาย</span>'}</div>`;
            if (isRental && t.rental_start_date) {
                const s = String(t.rental_start_date).split('T')[0];
                const e = String(t.rental_end_date).split('T')[0];
                itemCol += `<small class="text-muted d-block">📅 ${s} ถึง ${e} (${t.rental_days || 1} วัน)</small>`;
            }

            // แสดงยอดเงินแจกแจง
            let amountCol = `<div class="fw-bold text-success">฿${Number(t.amount).toLocaleString()}</div>`;
            if (isRental) {
                const depositAmt = Number(t.deposit_amount || 0);
                const rentAmt = Math.max(0, Number(t.amount) - depositAmt);
                amountCol += `<small class="text-success d-block">ค่าเช่า: ฿${rentAmt.toLocaleString()}</small>`;
                amountCol += `<small class="text-primary d-block">มัดจำ: ฿${depositAmt.toLocaleString()}</small>`;
                if (t.rental_status === 'damage_claimed' || Number(t.claim_amount) > 0) {
                    amountCol += `<div class="badge bg-danger-subtle text-danger border border-danger mt-1 text-wrap text-start d-block" style="font-size: 0.72rem;">
                        <i class="bi bi-wrench me-1"></i>ขอหักมัดจำ: ฿${Number(t.claim_amount || 0).toLocaleString()}
                    </div>`;
                }
            }

            // แสดงผู้ซื้อ + สลิปที่โอนเข้า + พร้อมเพย์คืนมัดจำ
            let buyerCol = `<div>${escapeHtml(t.receiver_name)}</div>`;
            if (t.payment_reference) {
                buyerCol += `<a href="${escapeHtml(t.payment_reference)}" target="_blank" class="badge bg-light text-primary border border-primary text-decoration-none mt-1 d-inline-block"><i class="bi bi-receipt me-1"></i>ดูสลิปที่โอนเข้าคนกลาง</a>`;
            }
            if (t.is_slip_verified) {
                buyerCol += `<span class="badge bg-success-subtle text-success border border-success mt-1 ms-1 d-inline-block" title="รหัสอ้างอิง: ${escapeHtml(t.trans_ref || '')}"><i class="bi bi-patch-check-fill me-1"></i>SlipOK ผ่านแล้ว</span>`;
            }
            if (isRental) {
                if (t.buyer_bank_account) {
                    buyerCol += `<div class="mt-1 small text-primary"><span class="badge bg-primary-subtle text-primary border border-primary me-1"><i class="bi bi-bank me-1"></i>${escapeHtml(t.buyer_bank_name || 'ธนาคาร')}</span><strong>${escapeHtml(t.buyer_bank_account)}</strong><br><small class="text-muted">${escapeHtml(t.buyer_bank_account_name || '')}</small></div>`;
                } else if (t.buyer_promptpay) {
                    buyerCol += `<small class="text-primary d-block mt-1"><i class="bi bi-qr-code me-1"></i>พร้อมเพย์คืนมัดจำ: <strong>${escapeHtml(t.buyer_promptpay)}</strong>${t.buyer_promptpay_name ? ` (${escapeHtml(t.buyer_promptpay_name)})` : ''}</small>`;
                }
            }

            let sellerPayoutDisplay = '<span class="text-muted">-</span>';
            if (t.seller_bank_account) {
                sellerPayoutDisplay = `
                    <span class="badge bg-primary-subtle text-primary border border-primary mb-1"><i class="bi bi-bank me-1"></i>${escapeHtml(t.seller_bank_name || 'ธนาคาร')}</span><br>
                    <span class="fw-bold font-monospace text-dark">${escapeHtml(t.seller_bank_account)}</span><br>
                    <small class="text-muted">${escapeHtml(t.seller_bank_account_name || t.giver_name || '')}</small>
                `;
            } else if (t.seller_promptpay) {
                sellerPayoutDisplay = `
                    <span class="badge bg-success-subtle text-success border border-success mb-1"><i class="bi bi-qr-code me-1"></i>พร้อมเพย์</span><br>
                    <span class="fw-bold font-monospace text-success">${escapeHtml(t.seller_promptpay)}</span><br>
                    <small class="text-muted">${escapeHtml(t.seller_promptpay_name || '')}</small>
                `;
            }

            return `<tr>
                <td>${itemCol}</td>
                <td>${escapeHtml(t.giver_name)}</td>
                <td>${sellerPayoutDisplay}</td>
                <td>${buyerCol}</td>
                <td>${amountCol}</td>
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
                            <h5 class="modal-title"><i class="bi bi-wallet2 me-2"></i>อัปโหลดหลักฐานการโอนเงินให้ผู้ขาย</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <div id="adminSlipPayoutInfo" class="mb-3"></div>
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
        const settleBtn = event.target.closest('.settle-claim-btn');
        if (settleBtn) {
            const txId = settleBtn.dataset.id;
            const tx = currentAdminTransactions.find(t => String(t.trans_id) === String(txId));
            if (tx) {
                openSettleClaimModal(tx);
            }
            return;
        }

        const completeBtn = event.target.closest('.complete-tx-btn');
        if (completeBtn) {
            const txId = completeBtn.dataset.id;
            const tx = currentAdminTransactions.find(t => String(t.trans_id) === String(txId));
            document.getElementById('adminSlipTxId').value = txId;

            const payoutBox = document.getElementById('adminSlipPayoutInfo');
            if (payoutBox && tx) {
                let payoutDetails = '';
                const transferAmt = tx.item_type === 'rent' ? Math.max(0, Number(tx.amount || 0) - Number(tx.deposit_amount || 0)) : Number(tx.amount || 0);
                if (tx.seller_bank_account) {
                    payoutDetails = `
                        <div class="p-3 bg-light rounded-3 border">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-dark"><i class="bi bi-person-fill text-primary me-1"></i>ผู้ขาย / ผู้ให้เช่า: ${escapeHtml(tx.giver_name)}</span>
                                <span class="badge bg-success fs-6">ยอดโอน: ฿${transferAmt.toLocaleString()}</span>
                            </div>
                            <div class="mb-1">
                                <span class="badge bg-primary-subtle text-primary border border-primary me-1"><i class="bi bi-bank me-1"></i>${escapeHtml(tx.seller_bank_name || 'ธนาคาร')}</span>
                                เลขบัญชี: <strong class="font-monospace fs-6 text-dark">${escapeHtml(tx.seller_bank_account)}</strong>
                            </div>
                            <div class="small text-muted mb-2">ชื่อบัญชี: <strong>${escapeHtml(tx.seller_bank_account_name || tx.giver_name)}</strong></div>
                            <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="navigator.clipboard.writeText('${escapeHtml(tx.seller_bank_account)}'); alert('คัดลอกเลขบัญชีแล้ว!');"><i class="bi bi-clipboard me-1"></i>คัดลอกเลขบัญชี</button>
                        </div>
                    `;
                } else if (tx.seller_promptpay) {
                    payoutDetails = `
                        <div class="p-3 bg-light rounded-3 border">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="fw-bold text-dark"><i class="bi bi-person-fill text-primary me-1"></i>ผู้ขาย / ผู้ให้เช่า: ${escapeHtml(tx.giver_name)}</span>
                                <span class="badge bg-success fs-6">ยอดโอน: ฿${transferAmt.toLocaleString()}</span>
                            </div>
                            <div class="mb-1">
                                <span class="badge bg-success-subtle text-success border border-success me-1"><i class="bi bi-qr-code me-1"></i>พร้อมเพย์</span>
                                เบอร์/เลข: <strong class="font-monospace fs-6 text-dark">${escapeHtml(tx.seller_promptpay)}</strong>
                            </div>
                            <div class="small text-muted mb-2">ชื่อพร้อมเพย์: <strong>${escapeHtml(tx.seller_promptpay_name || tx.giver_name)}</strong></div>
                            <button type="button" class="btn btn-sm btn-outline-secondary py-1 px-2" onclick="navigator.clipboard.writeText('${escapeHtml(tx.seller_promptpay)}'); alert('คัดลอกพร้อมเพย์แล้ว!');"><i class="bi bi-clipboard me-1"></i>คัดลอกพร้อมเพย์</button>
                        </div>
                    `;
                } else {
                    payoutDetails = `
                        <div class="p-3 bg-light rounded-3 border text-muted">
                            <div class="d-flex justify-content-between align-items-center">
                                <span>ผู้รับเงิน: <strong>${escapeHtml(tx.giver_name)}</strong></span>
                                <span class="badge bg-success fs-6">ยอดโอน: ฿${transferAmt.toLocaleString()}</span>
                            </div>
                            <div class="small text-danger mt-1"><i class="bi bi-exclamation-circle me-1"></i>ผู้ใช้นี้ยังไม่ได้ระบุพร้อมเพย์หรือบัญชีธนาคาร</div>
                        </div>
                    `;
                }
                payoutBox.innerHTML = payoutDetails;
            }

            const modal = new bootstrap.Modal(document.getElementById('adminSlipModal'));
            modal.show();
        }
    });

    function openDamageImageLightbox(imageUrl, title) {
        let lb = document.getElementById('damageImageLightboxModal');
        if (lb) lb.remove();

        const lbHtml = `
            <div class="modal fade" id="damageImageLightboxModal" tabindex="-1" style="z-index: 1070;" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content rounded-4 border-0 shadow-lg bg-dark text-white">
                        <div class="modal-header border-secondary py-2 px-3">
                            <h6 class="modal-title fw-bold text-white"><i class="bi bi-card-image me-2 text-warning"></i>ภาพหลักฐานความเสียหาย: ${escapeHtml(title || '')}</h6>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-2 text-center bg-black">
                            <img src="${escapeHtml(imageUrl)}" class="img-fluid rounded-2 shadow" style="max-height: 70vh; max-width: 100%; object-fit: contain;" alt="รูปภาพหลักฐาน">
                        </div>
                        <div class="modal-footer border-secondary py-2 px-3 d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">ปิดหน้าต่าง</button>
                            <a href="${escapeHtml(imageUrl)}" target="_blank" class="btn btn-warning btn-sm text-dark fw-bold">
                                <i class="bi bi-box-arrow-up-right me-1"></i>เปิดไฟล์ขนาดเต็มในแท็บใหม่
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', lbHtml);
        const lbModal = new bootstrap.Modal(document.getElementById('damageImageLightboxModal'));
        lbModal.show();
    }

    function openSettleClaimModal(tx) {
        let modalEl = document.getElementById('adminSettleClaimModal');
        if (modalEl) modalEl.remove();

        const depositAmt = Number(tx.deposit_amount || 0);
        const totalAmt = Number(tx.amount || 0);
        const rentAmt = Math.max(0, totalAmt - depositAmt);
        const requestedClaim = Number(tx.claim_amount || 0);

        let consentNotice = '';
        if (tx.claim_status === 'accepted') {
            consentNotice = `
                <div class="alert alert-success d-flex align-items-center py-2 px-3 mb-3 border-2">
                    <i class="bi bi-check-circle-fill fs-4 me-2 text-success"></i>
                    <div>
                        <strong class="d-block">ผู้เช่ายินยอมให้หักเงินมัดจำแล้ว</strong>
                        <small class="text-muted">ผู้เช่าได้ตรวจสอบและกดยินยอมให้หักเงินมัดจำตามจำนวน ฿${requestedClaim.toLocaleString()} เรียบร้อยแล้ว</small>
                    </div>
                </div>
            `;
        } else if (tx.claim_status === 'rejected') {
            consentNotice = `
                <div class="alert alert-danger d-flex align-items-center py-2 px-3 mb-3 border-2">
                    <i class="bi bi-x-octagon-fill fs-4 me-2 text-danger"></i>
                    <div>
                        <strong class="d-block">ผู้เช่าไม่ยินยอม / ต้องการให้แอดมินตัดสิน</strong>
                        <small class="text-muted">ผู้เช่าปฏิเสธยอดหักนี้ กรุณาตรวจสอบภาพหลักฐานและตัดสินตามความเหมาะสม</small>
                    </div>
                </div>
            `;
        } else {
            consentNotice = `
                <div class="alert alert-warning d-flex align-items-center py-2 px-3 mb-3 border-2">
                    <i class="bi bi-chat-dots-fill fs-4 me-2 text-warning"></i>
                    <div>
                        <strong class="d-block">อยู่ระหว่างเจรจา / รอผู้เช่าตอบ</strong>
                        <small class="text-muted">ผู้เช่ายังไม่ได้กดตอบรับ แอดมินสามารถช่วยไกล่เกลี่ยหรือตัดสินตามหลักฐานได้ทันที</small>
                    </div>
                </div>
            `;
        }

        const imageHtml = tx.claim_image
            ? `<div class="mb-3">
                    <label class="form-label fw-bold text-muted small mb-1">รูปถ่ายความเสียหายที่ผู้ให้เช่าแนบมา:</label>
                    <div class="d-flex align-items-start gap-3">
                        <div id="triggerClaimImagePreview" class="position-relative rounded-3 overflow-hidden border shadow-sm" style="width: 140px; height: 140px; flex-shrink: 0; cursor: pointer;" title="คลิกเพื่อดูภาพขยาย">
                            <img src="${escapeHtml(tx.claim_image)}" class="w-100 h-100 object-fit-cover" alt="หลักฐานความเสียหาย">
                            <span class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center py-1 small" style="font-size: 0.72rem;"><i class="bi bi-arrows-fullscreen me-1"></i>คลิกดูภาพใหญ่</span>
                        </div>
                        <div class="small text-muted flex-grow-1">
                            <p class="mb-1 fw-bold text-dark"><i class="bi bi-info-circle me-1"></i>เหตุผล / รายละเอียดความเสียหาย:</p>
                            <div class="p-2 bg-light rounded border text-dark mb-2" style="max-height: 85px; overflow-y: auto; white-space: pre-wrap;">${escapeHtml(tx.claim_reason || 'ไม่ได้ระบุเหตุผล')}</div>
                            <button type="button" class="btn btn-sm btn-outline-primary py-1 px-2" id="openClaimImageNewTabBtn" style="font-size: 0.8rem;">
                                <i class="bi bi-box-arrow-up-right me-1"></i>เปิดดูรูปขนาดเต็มในแท็บใหม่
                            </button>
                        </div>
                    </div>
               </div>`
            : `<div class="mb-3 p-3 bg-light rounded text-muted small">
                    <p class="mb-1 fw-bold text-dark"><i class="bi bi-info-circle me-1"></i>เหตุผล / รายละเอียดความเสียหาย:</p>
                    <div class="p-2 bg-white rounded border text-dark mb-2" style="white-space: pre-wrap;">${escapeHtml(tx.claim_reason || 'ไม่ได้ระบุเหตุผล')}</div>
                    <em>(ไม่มีการแนบรูปภาพความเสียหาย)</em>
               </div>`;

        const modalHtml = `
            <div class="modal fade" id="adminSettleClaimModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-warning-subtle text-dark border-bottom border-warning">
                            <h5 class="modal-title fw-bold"><i class="bi bi-shield-exclamation text-danger me-2"></i>ไกล่เกลี่ยค่าเสียหายและจัดสรรเงินมัดจำ (รหัสธุรกรรม #${tx.trans_id})</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <!-- รายการเช่า -->
                            <div class="p-3 bg-light rounded-3 mb-3 border">
                                <div class="row g-2 align-items-center">
                                    <div class="col-md-7">
                                        <div class="text-muted small">สินค้าให้เช่า:</div>
                                        <strong class="fs-6 text-dark">${escapeHtml(tx.item_title)}</strong>
                                        <div class="small text-muted">ระยะเวลาเช่า: ${tx.rental_days || 1} วัน</div>
                                    </div>
                                    <div class="col-md-5 text-md-end">
                                        <div class="small text-muted">เงินที่ระบบถือไว้ทั้งหมด: <strong class="text-success fs-6">฿${totalAmt.toLocaleString()}</strong></div>
                                        <div class="small text-secondary">(ค่าเช่า ฿${rentAmt.toLocaleString()} + มัดจำ ฿${depositAmt.toLocaleString()})</div>
                                    </div>
                                </div>
                            </div>

                            <!-- สถานะความยินยอมของผู้เช่า -->
                            ${consentNotice}

                            <!-- หลักฐานความเสียหาย -->
                            ${imageHtml}

                            <!-- ข้อมูลบัญชีผู้รับเงิน -->
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <div class="p-2 rounded border bg-light small h-100">
                                        <span class="text-muted d-block"><i class="bi bi-person-fill text-primary me-1"></i>ผู้ให้เช่า (รับค่าเช่า + ค่าชดเชย):</span>
                                        <strong>${escapeHtml(tx.giver_name)}</strong>
                                        ${tx.seller_bank_account ? `
                                            <div class="mt-1">
                                                <span class="badge bg-primary-subtle text-primary border border-primary me-1"><i class="bi bi-bank me-1"></i>${escapeHtml(tx.seller_bank_name || 'ธนาคาร')}</span>
                                                <strong class="font-monospace text-dark">${escapeHtml(tx.seller_bank_account)}</strong>
                                                <div class="small text-muted">ชื่อ: ${escapeHtml(tx.seller_bank_account_name || tx.giver_name)}</div>
                                            </div>
                                        ` : `
                                            <div class="text-success mt-1"><i class="bi bi-qr-code me-1"></i>พร้อมเพย์: <strong>${escapeHtml(tx.seller_promptpay || 'ไม่ระบุ')}</strong> ${tx.seller_promptpay_name ? `(${escapeHtml(tx.seller_promptpay_name)})` : ''}</div>
                                        `}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-2 rounded border bg-light small h-100">
                                        <span class="text-muted d-block"><i class="bi bi-person-fill text-warning me-1"></i>ผู้เช่า (รับเงินมัดจำคืน):</span>
                                        <strong>${escapeHtml(tx.receiver_name)}</strong>
                                        ${tx.buyer_bank_account ? `
                                            <div class="mt-1">
                                                <span class="badge bg-primary-subtle text-primary border border-primary me-1"><i class="bi bi-bank me-1"></i>${escapeHtml(tx.buyer_bank_name || 'ธนาคาร')}</span>
                                                <strong class="font-monospace text-dark">${escapeHtml(tx.buyer_bank_account)}</strong>
                                                <div class="small text-muted">ชื่อ: ${escapeHtml(tx.buyer_bank_account_name || tx.receiver_name)}</div>
                                            </div>
                                        ` : `
                                            <div class="text-primary mt-1"><i class="bi bi-qr-code me-1"></i>พร้อมเพย์คืนมัดจำ: <strong>${escapeHtml(tx.buyer_promptpay || 'ไม่ระบุ')}</strong> ${tx.buyer_promptpay_name ? `(${escapeHtml(tx.buyer_promptpay_name)})` : ''}</div>
                                        `}
                                    </div>
                                </div>
                            </div>

                            <hr class="my-3">

                            <!-- ช่องระบุยอดเงินที่อนุมัติ -->
                            <div class="mb-3">
                                <label class="form-label fw-bold d-flex justify-content-between align-items-center">
                                    <span><i class="bi bi-cash-coin me-1 text-danger"></i>ยอดเงินค่าชดเชยที่แอดมินอนุมัติให้หักจากมัดจำ (฿):</span>
                                    <span class="small text-muted">เจ้าของขอหัก: ฿${requestedClaim.toLocaleString()} (มัดจำเต็ม: ฿${depositAmt.toLocaleString()})</span>
                                </label>
                                <div class="input-group">
                                    <span class="input-group-text bg-white fw-bold">฿</span>
                                    <input type="number" id="settleApprovedInput" class="form-control form-control-lg fw-bold text-danger" min="0" max="${depositAmt}" step="1" value="${Math.min(requestedClaim, depositAmt)}">
                                    <button class="btn btn-outline-secondary" type="button" id="setClaimToRequestedBtn">ตามที่เจ้าของขอ</button>
                                    <button class="btn btn-outline-secondary" type="button" id="setClaimToZeroBtn">ไม่หัก (0 บาท)</button>
                                    <button class="btn btn-outline-secondary" type="button" id="setClaimToMaxBtn">หักเต็มมัดจำ</button>
                                </div>
                                <div class="form-text text-muted">แอดมินสามารถปรับเพิ่ม/ลดยอดเงินหักได้ตามสมควร (ต้องไม่เกินวงเงินมัดจำ ฿${depositAmt.toLocaleString()})</div>
                            </div>

                            <!-- Live Split Preview Card -->
                            <div class="p-3 bg-light-subtle border rounded-3 mb-3">
                                <div class="fw-bold mb-2 text-dark small"><i class="bi bi-calculator me-1"></i>สรุปการโอนเงินตามสัดส่วน (Live Preview):</div>
                                <div class="row g-2 text-center">
                                    <div class="col-6">
                                        <div class="p-2 border rounded bg-white shadow-sm">
                                            <div class="small text-muted mb-1"><i class="bi bi-arrow-up-right-circle text-success me-1"></i>โอนให้ผู้ให้เช่า</div>
                                            <div class="fs-5 fw-bold text-success" id="previewOwnerPayout">฿0</div>
                                            <div class="small text-secondary" id="previewOwnerFormula">ค่าเช่า + ชดเชย</div>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="p-2 border rounded bg-white shadow-sm">
                                            <div class="small text-muted mb-1"><i class="bi bi-arrow-down-left-circle text-primary me-1"></i>โอนคืนให้ผู้เช่า</div>
                                            <div class="fs-5 fw-bold text-primary" id="previewRenterRefund">฿0</div>
                                            <div class="small text-secondary" id="previewRenterFormula">มัดจำส่วนที่เหลือ</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- คำตัดสิน / บันทึกแอดมิน -->
                            <div class="mb-3">
                                <label class="form-label fw-bold small text-muted">บันทึกคำตัดสิน / หมายเหตุของแอดมิน:</label>
                                <textarea id="settleDecisionInput" class="form-control" rows="2" placeholder="ระบุเหตุผลในการตัดสินให้ทั้งสองฝ่ายทราบ (เช่น แอดมินได้ตรวจสอบภาพถ่ายความเสียหายแล้ว อนุมัติหักเงินมัดจำตามจริง...)">${tx.claim_status === 'accepted' ? 'ผู้เช่ายินยอมให้หักเงินมัดจำตามที่ผู้ให้เช่าร้องขอ แอดมินดำเนินการโอนเงินตามสัดส่วนเรียบร้อยแล้ว' : 'แอดมินตรวจสอบหลักฐานความเสียหายแล้ว ดำเนินการตัดสินและโอนเงินแบ่งตามสัดส่วนความเสียหาย'}</textarea>
                            </div>

                            <!-- แนบสลิปแยก 2 ช่อง -->
                            <div class="mb-3">
                                <label class="form-label fw-bold text-dark small mb-2"><i class="bi bi-receipt-cutoff text-success me-1"></i>แนบหลักฐานการโอนเงินของแอดมิน (แยกตามบัญชีผู้รับ):</label>
                                <div class="row g-2">
                                    <!-- ฝั่งผู้ให้เช่า -->
                                    <div class="col-md-6">
                                        <div class="p-3 border rounded-3 bg-light h-100 shadow-sm">
                                            <div class="d-flex justify-content-between align-items-center mb-1">
                                                <strong class="text-success small"><i class="bi bi-arrow-up-right-circle me-1"></i>สลิปโอนให้ผู้ให้เช่า</strong>
                                                <span class="badge bg-success" id="ownerSlipBadgeAmt">฿0</span>
                                            </div>
                                            <div class="small text-muted mb-2 text-truncate">${tx.seller_bank_account ? `<span class="badge bg-primary-subtle text-primary border border-primary me-1">${escapeHtml(tx.seller_bank_name || 'ธนาคาร')}</span><strong>${escapeHtml(tx.seller_bank_account)}</strong>` : `พร้อมเพย์: <strong>${escapeHtml(tx.seller_promptpay || 'ไม่ระบุ')}</strong>`}</div>
                                            <input type="file" id="settleOwnerSlipInput" class="form-control form-control-sm border" accept="image/jpeg,image/png">
                                            <small class="text-secondary d-block mt-1" style="font-size: 0.72rem;">* ค่าเช่า + ค่าชดเชยความเสียหาย</small>
                                        </div>
                                    </div>
                                    <!-- ฝั่งผู้เช่า -->
                                    <div class="col-md-6" id="renterSlipBox">
                                        <div class="p-3 border rounded-3 bg-light h-100 shadow-sm" id="renterSlipActiveCard">
                                            <div class="d-flex justify-content-between align-items-center mb-1">
                                                <strong class="text-primary small"><i class="bi bi-arrow-down-left-circle me-1"></i>สลิปโอนคืนให้ผู้เช่า</strong>
                                                <span class="badge bg-primary" id="renterSlipBadgeAmt">฿0</span>
                                            </div>
                                            <div class="small text-muted mb-2 text-truncate">${tx.buyer_bank_account ? `<span class="badge bg-primary-subtle text-primary border border-primary me-1">${escapeHtml(tx.buyer_bank_name || 'ธนาคาร')}</span><strong>${escapeHtml(tx.buyer_bank_account)}</strong>` : `พร้อมเพย์: <strong>${escapeHtml(tx.buyer_promptpay || 'ไม่ระบุ')}</strong>`}</div>
                                            <input type="file" id="settleRenterSlipInput" class="form-control form-control-sm border" accept="image/jpeg,image/png">
                                            <small class="text-secondary d-block mt-1" style="font-size: 0.72rem;">* เงินมัดจำส่วนที่เหลือ</small>
                                        </div>
                                        <div class="p-3 border border-dashed rounded-3 bg-white text-center text-muted small h-100 d-none justify-content-center align-items-center" id="renterSlipZeroCard">
                                            <div>
                                                <i class="bi bi-check-circle-fill text-muted fs-4 d-block mb-1"></i>
                                                <strong class="text-dark">หักมัดจำเต็มจำนวน (ยอดคืน ฿0)</strong>
                                                <div class="text-secondary mt-1" style="font-size: 0.72rem;">ไม่ต้องแนบสลิปคืนมัดจำ</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                            <button type="button" id="confirmSettleBtn" class="btn btn-warning text-dark fw-bold px-4">
                                <i class="bi bi-check2-circle me-1"></i> ยืนยันการตัดสินและปิดธุรกรรม
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalInstance = new bootstrap.Modal(document.getElementById('adminSettleClaimModal'));
        modalInstance.show();

        // Image lightbox handlers
        const triggerImgEl = document.getElementById('triggerClaimImagePreview');
        if (triggerImgEl && tx.claim_image) {
            triggerImgEl.addEventListener('click', () => {
                openDamageImageLightbox(tx.claim_image, tx.item_title);
            });
        }
        const openNewTabBtn = document.getElementById('openClaimImageNewTabBtn');
        if (openNewTabBtn && tx.claim_image) {
            openNewTabBtn.addEventListener('click', () => {
                window.open(tx.claim_image, '_blank');
            });
        }

        const inputEl = document.getElementById('settleApprovedInput');
        const previewOwnerEl = document.getElementById('previewOwnerPayout');
        const previewRenterEl = document.getElementById('previewRenterRefund');
        const previewOwnerFormulaEl = document.getElementById('previewOwnerFormula');
        const previewRenterFormulaEl = document.getElementById('previewRenterFormula');
        const ownerSlipBadgeAmtEl = document.getElementById('ownerSlipBadgeAmt');
        const renterSlipBadgeAmtEl = document.getElementById('renterSlipBadgeAmt');
        const renterSlipActiveCard = document.getElementById('renterSlipActiveCard');
        const renterSlipZeroCard = document.getElementById('renterSlipZeroCard');
        const settleRenterSlipInput = document.getElementById('settleRenterSlipInput');

        function updatePreview() {
            let approved = parseFloat(inputEl.value) || 0;
            if (approved < 0) approved = 0;
            if (approved > depositAmt) approved = depositAmt;

            const ownerTotal = rentAmt + approved;
            const renterRemaining = Math.max(0, depositAmt - approved);

            previewOwnerEl.textContent = `฿${ownerTotal.toLocaleString()}`;
            previewOwnerFormulaEl.textContent = `ค่าเช่า ฿${rentAmt.toLocaleString()} + ชดเชย ฿${approved.toLocaleString()}`;

            previewRenterEl.textContent = `฿${renterRemaining.toLocaleString()}`;
            previewRenterFormulaEl.textContent = `มัดจำ ฿${depositAmt.toLocaleString()} - หัก ฿${approved.toLocaleString()}`;

            if (ownerSlipBadgeAmtEl) ownerSlipBadgeAmtEl.textContent = `฿${ownerTotal.toLocaleString()}`;
            if (renterSlipBadgeAmtEl) renterSlipBadgeAmtEl.textContent = `฿${renterRemaining.toLocaleString()}`;

            if (renterRemaining <= 0) {
                if (renterSlipActiveCard) renterSlipActiveCard.classList.add('d-none');
                if (renterSlipZeroCard) {
                    renterSlipZeroCard.classList.remove('d-none');
                    renterSlipZeroCard.classList.add('d-flex');
                }
                if (settleRenterSlipInput) settleRenterSlipInput.value = '';
            } else {
                if (renterSlipActiveCard) renterSlipActiveCard.classList.remove('d-none');
                if (renterSlipZeroCard) {
                    renterSlipZeroCard.classList.add('d-none');
                    renterSlipZeroCard.classList.remove('d-flex');
                }
            }
        }

        inputEl.addEventListener('input', updatePreview);
        document.getElementById('setClaimToRequestedBtn').addEventListener('click', () => {
            inputEl.value = Math.min(requestedClaim, depositAmt);
            updatePreview();
        });
        document.getElementById('setClaimToZeroBtn').addEventListener('click', () => {
            inputEl.value = 0;
            updatePreview();
        });
        document.getElementById('setClaimToMaxBtn').addEventListener('click', () => {
            inputEl.value = depositAmt;
            updatePreview();
        });

        updatePreview();

        document.getElementById('confirmSettleBtn').addEventListener('click', async () => {
            let approved = parseFloat(inputEl.value);
            if (isNaN(approved) || approved < 0) {
                alert('กรุณากรอกจำนวนเงินค่าชดเชยที่ถูกต้อง (ตัวเลข 0 ขึ้นไป)');
                return;
            }
            if (approved > depositAmt) {
                alert(`ยอดค่าชดเชยต้องไม่เกินเงินมัดจำ (฿${depositAmt.toLocaleString()})`);
                return;
            }

            const decision = document.getElementById('settleDecisionInput').value.trim();
            const ownerSlipFile = document.getElementById('settleOwnerSlipInput')?.files[0];
            const renterSlipFile = document.getElementById('settleRenterSlipInput')?.files[0];

            const ownerTotal = rentAmt + approved;
            const renterRemaining = Math.max(0, depositAmt - approved);

            const confirmMsg = `ยืนยันการตัดสินและโอนเงินแบ่งตามสัดส่วน:\n- ผู้ให้เช่า (${tx.giver_name}) ได้รับ ฿${ownerTotal.toLocaleString()} (ค่าเช่า ฿${rentAmt.toLocaleString()} + ชดเชย ฿${approved.toLocaleString()})\n- ผู้เช่า (${tx.receiver_name}) ได้คืน ฿${renterRemaining.toLocaleString()}\n\nดำเนินการต่อหรือไม่?`;
            if (!confirm(confirmMsg)) return;

            const submitBtn = document.getElementById('confirmSettleBtn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>กำลังบันทึก...';

            const formData = new FormData();
            formData.append('approved_claim_amount', approved);
            formData.append('admin_decision', decision || 'แอดมินดำเนินการโอนเงินแบ่งตามสัดส่วนความเสียหายเรียบร้อยแล้ว');
            if (ownerSlipFile) {
                formData.append('owner_slip', ownerSlipFile);
            }
            if (renterSlipFile && renterRemaining > 0) {
                formData.append('renter_slip', renterSlipFile);
            }

            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const response = await fetch(`/api/admin/transactions/${tx.trans_id}/settle-claim`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'บันทึกไม่สำเร็จ');

                alert('ตัดสินและจัดสรรเงินมัดจำเรียบร้อยแล้ว');
                modalInstance.hide();
                loadView('transactions');
            } catch (err) {
                alert('เกิดข้อผิดพลาด: ' + err.message);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> ยืนยันการตัดสินและปิดธุรกรรม';
            }
        });
    }

    function openInspectItemModal(item) {
        let inspectModalEl = document.getElementById('adminInspectItemModal');
        if (inspectModalEl) inspectModalEl.remove();

        const isRental = item.item_type === 'rent';
        const isSell = item.item_type === 'sell';

        let images = [];
        if (item.gallery_images) {
            images = item.gallery_images.split(',').filter(Boolean);
        } else if (item.image_url) {
            images = [item.image_url];
        }

        const galleryHtml = images.length > 0
            ? images.map(img => `
                <a href="${img}" target="_blank" class="d-inline-block position-relative border rounded-3 overflow-hidden shadow-sm" style="width: 100px; height: 100px;">
                    <img src="${img}" class="w-100 h-100 object-fit-cover" alt="รูปสินค้า">
                </a>
            `).join('')
            : '<span class="text-muted">ไม่มีรูปภาพ</span>';

        const typeBadge = isRental
            ? '<span class="badge bg-warning text-dark fs-6"><i class="bi bi-key-fill me-1"></i>รายการปล่อยเช่า</span>'
            : isSell
                ? '<span class="badge bg-primary fs-6"><i class="bi bi-tag-fill me-1"></i>รายการขาย</span>'
                : '<span class="badge bg-success fs-6"><i class="bi bi-gift-fill me-1"></i>รายการส่งต่อฟรี</span>';

        const pricingHtml = isRental
            ? `<div class="p-3 bg-warning-subtle border border-warning rounded-3 mb-3">
                    <div class="row text-center">
                        <div class="col-6 border-end border-warning">
                            <span class="text-muted d-block small">ค่าเช่าต่อวัน</span>
                            <strong class="text-success fs-5">฿${Number(item.price).toLocaleString()}</strong>
                        </div>
                        <div class="col-6">
                            <span class="text-muted d-block small">เงินมัดจำประกันสินค้า</span>
                            <strong class="text-primary fs-5">฿${Number(item.deposit || 0).toLocaleString()}</strong>
                        </div>
                    </div>
               </div>`
            : isSell
                ? `<div class="p-3 bg-primary-subtle border border-primary rounded-3 mb-3">
                        <span class="text-muted d-block small">ราคาขาย</span>
                        <strong class="text-primary fs-5">฿${Number(item.price).toLocaleString()}</strong>
                   </div>`
                : `<div class="p-3 bg-success-subtle border border-success rounded-3 mb-3">
                        <strong class="text-success fs-5">ส่งต่อฟรี ไม่มีค่าใช้จ่าย</strong>
                   </div>`;

        const modalHtml = `
            <div class="modal fade" id="adminInspectItemModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-dark text-white">
                            <div class="d-flex align-items-center gap-2">
                                <span class="badge bg-warning text-dark"><i class="bi bi-shield-check"></i> ตรวจสอบโพสต์</span>
                                <h5 class="modal-title mb-0 fw-bold">ตรวจสอบความถูกต้องและข้อกฎหมาย</h5>
                            </div>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <!-- แถบเตือนตรวจของผิดกฎหมาย -->
                            <div class="alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-3">
                                <i class="bi bi-exclamation-triangle-fill fs-5 text-warning flex-shrink-0"></i>
                                <div>
                                    <strong>ข้อควรระวังในการตรวจสอบ:</strong> ตรวจสอบว่าสินค้าไม่ใช่อาวุธ วัตถุลามก ยาเสพติด สินค้าอันตราย สินค้าละเมิดลิขสิทธิ์ หรือมีลักษณะหลอกลวง ก่อนกดอนุมัติ
                                </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h4 class="fw-bold mb-1">${escapeHtml(item.title)}</h4>
                                    <span class="badge bg-light text-dark border me-2"><i class="bi bi-grid me-1"></i>หมวดหมู่: ${escapeHtml(item.category)}</span>
                                    <span class="text-muted small"><i class="bi bi-clock me-1"></i>โพสต์เมื่อ: ${new Date(item.created_at).toLocaleString('th-TH')}</span>
                                </div>
                                <div>${typeBadge}</div>
                            </div>

                            ${pricingHtml}

                            <!-- รูปภาพทั้งหมด -->
                            <div class="mb-3">
                                <label class="form-label fw-bold small text-muted"><i class="bi bi-images me-1"></i>รูปภาพสินค้า (${images.length} รูป - คลิกดูขนาดเต็มได้):</label>
                                <div class="d-flex flex-wrap gap-2">
                                    ${galleryHtml}
                                </div>
                            </div>

                            <!-- รายละเอียด -->
                            <div class="mb-3">
                                <label class="form-label fw-bold small text-muted"><i class="bi bi-card-text me-1"></i>รายละเอียดสินค้าทั้งหมด:</label>
                                <div class="p-3 bg-light rounded-3 border text-break" style="white-space: pre-wrap; font-size: 0.95rem;">${escapeHtml(item.description || 'ไม่มีรายละเอียด')}</div>
                            </div>

                            <!-- พิกัดและผู้โพสต์ -->
                            <div class="row g-2 mb-3">
                                <div class="col-md-6">
                                    <div class="p-2 border rounded-3 bg-light small">
                                        <div class="fw-bold text-muted"><i class="bi bi-geo-alt me-1"></i>สถานที่นัดรับ / พิกัด:</div>
                                        <div>${escapeHtml(item.location || 'ไม่ระบุสถานที่')}</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-2 border rounded-3 bg-light small">
                                        <div class="fw-bold text-muted"><i class="bi bi-person me-1"></i>ข้อมูลผู้โพสต์:</div>
                                        <div><strong>${escapeHtml(item.owner_name)}</strong> (${escapeHtml(item.owner_email)})</div>
                                        ${item.owner_phone ? `<div>โทร: ${escapeHtml(item.owner_phone)}</div>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-light justify-content-between">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ปิดหน้าต่าง</button>
                            <div class="d-flex gap-2">
                                <button type="button" class="btn btn-outline-danger fw-bold modal-reject-btn" data-item-id="${item.item_id}">
                                    <i class="bi bi-x-circle me-1"></i>ไม่อนุมัติ (ระบุเหตุผล)
                                </button>
                                <button type="button" class="btn btn-success fw-bold modal-approve-btn" data-item-id="${item.item_id}">
                                    <i class="bi bi-check-circle me-1"></i>อนุมัติให้แสดงบนเว็บ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('adminInspectItemModal'));
        modal.show();
    }

    async function handleApproveItem(itemId) {
        if (!confirm('ยืนยันอนุมัติสินค้านี้ให้แสดงบนเว็บใช่หรือไม่?')) return;
        try {
            await requestJson(`/api/admin/items/${itemId}/approve`, { method: 'PATCH' });
            alert('อนุมัติสินค้าสำเร็จ! สินค้าจะแสดงบนหน้าเว็บให้ผู้ใช้งานเห็นทันที');
            const inspectModalEl = document.getElementById('adminInspectItemModal');
            if (inspectModalEl) {
                const modalInstance = bootstrap.Modal.getInstance(inspectModalEl);
                if (modalInstance) modalInstance.hide();
            }
            loadView('pendingItems');
            loadDashboard();
        } catch (err) { alert(err.message); }
    }

    async function handleRejectItem(itemId) {
        const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติโพสต์นี้ (เช่น สินค้าผิดกฎหมาย, รายละเอียดไม่ชัดเจน):');
        if (reason === null) return;
        try {
            await requestJson(`/api/admin/items/${itemId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason })
            });
            alert('ไม่อนุมัติและบันทึกเหตุผลสำเร็จ ระบบได้ส่งแจ้งเตือนไปยังเจ้าของโพสต์แล้ว');
            const inspectModalEl = document.getElementById('adminInspectItemModal');
            if (inspectModalEl) {
                const modalInstance = bootstrap.Modal.getInstance(inspectModalEl);
                if (modalInstance) modalInstance.hide();
            }
            loadView('pendingItems');
            loadDashboard();
        } catch (err) { alert(err.message); }
    }

    document.getElementById('adminViewPendingItems').addEventListener('click', async event => {
        const inspectBtn = event.target.closest('.inspect-item-btn');
        const approveBtn = event.target.closest('.approve-item-btn');
        const rejectBtn = event.target.closest('.reject-item-btn');

        if (inspectBtn) {
            const itemId = Number(inspectBtn.dataset.itemId);
            const item = cachedPendingItems.find(i => Number(i.item_id) === itemId);
            if (item) openInspectItemModal(item);
        } else if (approveBtn) {
            handleApproveItem(approveBtn.dataset.itemId);
        } else if (rejectBtn) {
            handleRejectItem(rejectBtn.dataset.itemId);
        }
    });

    document.body.addEventListener('click', event => {
        const modalApproveBtn = event.target.closest('.modal-approve-btn');
        const modalRejectBtn = event.target.closest('.modal-reject-btn');
        if (modalApproveBtn) {
            handleApproveItem(modalApproveBtn.dataset.itemId);
        } else if (modalRejectBtn) {
            handleRejectItem(modalRejectBtn.dataset.itemId);
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
