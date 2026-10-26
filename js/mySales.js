// ====================================================
// 📊 mySales.js : หน้าต่างการส่งมอบของฉัน (สำหรับคนขาย / ผู้แจก)
// ดีไซน์ใหม่: สบายตา อ่านง่าย แยกหมวดหมู่ชัดเจน ไม่ซ้อนกล่อง
// มีการแสดงวันเวลาที่ซื้อขาย/ส่งมอบ และเรียงลำดับรายการล่าสุดขึ้นก่อน
// ====================================================

window.openMySalesModal = async () => {
    function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
    function getUserId() { const u = getUser(); return u?.id || u?.user_id || u?.userId; }

    function formatDateTime(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const dateFormatted = d.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        const timeFormatted = d.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${dateFormatted} เวลา ${timeFormatted} น.`;
    }

    async function requestJson(url, options = {}) {
        options.headers = options.headers || {};
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token && !options.headers['Authorization']) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    const userId = getUserId();
    if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');

    // ปิด modal อื่นๆ ที่อาจเปิดค้างอยู่เพื่อป้องกันการซ้อนกัน
    const existingReqModal = bootstrap.Modal.getInstance(document.getElementById('myRequestsModal'));
    if (existingReqModal) existingReqModal.hide();
    document.getElementById('myRequestsModal')?.remove();

    try {
        const salesData = await requestJson('/api/my-sales').catch(() => ({ sales: [] }));
        const sales = salesData.sales || [];

        // รวบรวมและจำแนกหมวดหมู่ตามรายการคำขอ (Order-based list)
        const returningEntries = []; // มีผู้เช่าส่งคืนของรอตรวจรับ (status === 'returning')
        const pendingEntries = [];   // มีคำขอรอตอบรับ (status === 'pending')
        const acceptedEntries = [];  // รอนัดรับส่งมอบ/อยู่ระหว่างเช่า (status === 'accepted' || status === 'renting')
        const completedEntries = []; // ส่งมอบเรียบร้อยแล้ว/คืนแล้ว (status === 'completed' || status === 'returned')

        sales.forEach(sale => {
            (sale.requests || []).forEach(req => {
                const entry = { sale, req };
                if (req.status === 'returning') {
                    returningEntries.push(entry);
                } else if (req.status === 'pending') {
                    pendingEntries.push(entry);
                } else if (req.status === 'accepted' || req.status === 'renting') {
                    acceptedEntries.push(entry);
                } else if (req.status === 'completed' || req.status === 'returned') {
                    completedEntries.push(entry);
                }
            });
        });

        // เรียงลำดับจากรายการล่าสุดไปเก่าสุดเสมอ (Newest first)
        const sortByLatest = (a, b) => {
            const timeA = new Date(a.req.updated_at || a.req.created_at || 0).getTime();
            const timeB = new Date(b.req.updated_at || b.req.created_at || 0).getTime();
            return timeB - timeA;
        };

        returningEntries.sort(sortByLatest);
        pendingEntries.sort(sortByLatest);
        acceptedEntries.sort(sortByLatest);
        completedEntries.sort(sortByLatest);

        const totalActive = returningEntries.length + pendingEntries.length + acceptedEntries.length;

        // ฟังก์ชันสร้างการ์ดคำขอแต่ละรายการฝั่งคนขาย (Clean Order Card Design)
        const renderSingleOrderCard = (sale, req, options = {}) => {
            const isReturning = req.status === 'returning';
            const isAccepted = req.status === 'accepted' || req.status === 'renting';
            const isPending = req.status === 'pending';
            const isCompleted = req.status === 'completed' || req.status === 'returned';
            const isLatest = !!options.isLatest;

            const typeBadge = sale.item_type === 'sell' 
                ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1">ขาย ฿${Number(sale.price).toLocaleString()}</span>`
                : sale.item_type === 'rent'
                ? `<span class="badge bg-warning-subtle text-dark border border-warning-subtle rounded-pill px-2 py-1">ให้เช่า ฿${Number(sale.price).toLocaleString()}/วัน</span>`
                : `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1">แจกฟรี</span>`;

            let headerBg = 'bg-light text-secondary';
            let headerIcon = '<i class="bi bi-info-circle me-1"></i>';
            let headerTitle = 'สถานะ: ' + req.status;

            if (isReturning) {
                headerBg = 'bg-info-subtle text-dark border-bottom border-info-subtle';
                headerIcon = '<i class="bi bi-truck text-primary me-1"></i>';
                headerTitle = 'ผู้เช่าแจ้งส่งคืนของแล้ว • รอคุณตรวจรับ';
            } else if (isPending) {
                headerBg = 'bg-warning-subtle text-dark border-bottom border-warning-subtle';
                headerIcon = '<i class="bi bi-hourglass-split text-warning me-1"></i>';
                headerTitle = 'มีคำขอใหม่ • รอคุณตอบรับ';
            } else if (isAccepted) {
                headerBg = 'bg-success-subtle text-success border-bottom border-success-subtle';
                headerIcon = '<i class="bi bi-box-seam text-success me-1"></i>';
                headerTitle = req.status === 'renting' 
                    ? 'กำลังเช่าอยู่ • ผู้เช่าได้รับของแล้ว' 
                    : 'ยอมรับแล้ว • อยู่ระหว่างนัดรับ / ส่งมอบ';
            } else if (isCompleted) {
                headerBg = 'bg-light text-muted border-bottom';
                headerIcon = '<i class="bi bi-check-circle-fill text-success me-1"></i>';
                headerTitle = req.status === 'returned' ? 'ตรวจรับของคืนสำเร็จเรียบร้อย' : 'ส่งมอบสำเร็จเรียบร้อยแล้ว';
            }

            const targetDate = isCompleted ? (req.updated_at || req.created_at) : (req.created_at || req.updated_at);
            const formattedDate = formatDateTime(targetDate);

            let dateLabel = 'ส่งคำขอเมื่อ';
            if (isCompleted) {
                dateLabel = req.status === 'returned' ? 'ตรวจรับคืนเมื่อ' : 'ส่งมอบ/ซื้อขายเมื่อ';
            } else if (isAccepted) {
                dateLabel = 'ตอบรับเมื่อ';
            } else if (isReturning) {
                dateLabel = 'แจ้งส่งคืนเมื่อ';
            }

            return `
                <div class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden bg-white my-sale-card" data-item-id="${sale.item_id}">
                    <!-- แถบบน: สถานะคำขอ & ประเภทสินค้า -->
                    <div class="px-3 py-2 d-flex justify-content-between align-items-center ${headerBg}">
                        <div class="fw-bold small d-flex align-items-center gap-2">
                            <span>${headerIcon}${headerTitle}</span>
                            ${isLatest ? '<span class="badge bg-success text-white rounded-pill px-2 py-0.5 shadow-sm" style="font-size: 0.72rem;"><i class="bi bi-lightning-charge-fill me-1"></i>ล่าสุด</span>' : ''}
                        </div>
                        <div>${typeBadge}</div>
                    </div>

                    <div class="p-3">
                        <!-- แถวสินค้า: รูป + ชื่อ + จำนวน + วันเวลาที่ซื้อขาย/ทำรายการ -->
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <img src="${sale.image_url || '/assets/pansuk_icon.jpg'}" 
                                 class="rounded-3 shadow-sm flex-shrink-0" style="width: 56px; height: 56px; object-fit: cover;">
                            <div class="flex-grow-1 min-width-0">
                                <h6 class="fw-bold mb-1 text-dark text-truncate fs-6">${escapeHtml(sale.title)}</h6>
                                <div class="small text-muted d-flex flex-wrap align-items-center gap-2">
                                    <span>คงเหลือ: <strong>${sale.quantity}</strong> ชิ้น</span>
                                    ${sale.quantity <= 0 ? '<span class="badge bg-danger-subtle text-danger">จอง/หมดแล้ว</span>' : ''}
                                </div>
                                ${formattedDate ? `
                                    <div class="small text-muted mt-1" style="font-size: 0.78rem;">
                                        <i class="bi bi-clock-history me-1 text-primary"></i>${dateLabel}: <strong class="text-dark">${formattedDate}</strong>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- กล่องข้อมูลผู้ขอรับ (แถบมน สะอาดตา) -->
                        <div class="bg-light rounded-3 p-3 mb-3 border">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div class="fw-bold text-dark small">
                                    <i class="bi bi-person-circle text-primary me-1"></i>ผู้ขอรับ: ${escapeHtml(req.requester_name || 'ผู้ใช้งาน')}
                                </div>
                                ${req.requester_phone ? `
                                    <a href="tel:${req.requester_phone}" class="badge bg-white text-dark border text-decoration-none py-1 px-2 shadow-sm">
                                        <i class="bi bi-telephone me-1 text-success"></i>${escapeHtml(req.requester_phone)}
                                    </a>
                                ` : ''}
                            </div>
                            ${req.message ? `
                                <div class="small text-secondary mt-2 pt-2 border-top">
                                    <i class="bi bi-chat-quote me-1 text-muted"></i> "${escapeHtml(req.message)}"
                                </div>
                            ` : ''}
                        </div>

                        <!-- แถวปุ่ม Action -->
                        <div class="d-flex gap-2 flex-wrap" data-request-id="${req.request_id}">
                            <button type="button" class="btn btn-sm btn-primary rounded-pill px-3 py-2 fw-bold flex-grow-1 chat-requester-btn shadow-sm"
                                    data-requester-id="${req.requester_id}" data-item-id="${sale.item_id}" data-title="${escapeHtml(sale.title)}">
                                <i class="bi bi-chat-dots-fill me-1"></i>แชตกับผู้ซื้อ
                            </button>
                            
                            ${isReturning ? `
                                <button type="button" class="btn btn-sm btn-success rounded-pill px-3 py-2 fw-bold flex-grow-1 confirm-return-req-btn shadow-sm">
                                    <i class="bi bi-check-circle-fill me-1"></i>✅ ตรวจรับของคืนแล้ว (นำเข้าสต็อก)
                                </button>
                            ` : ''}

                            ${isPending ? `
                                <button type="button" class="btn btn-sm btn-success rounded-pill px-3 py-2 fw-bold flex-grow-1 accept-req-btn shadow-sm">
                                    <i class="bi bi-check-lg me-1"></i>ยอมรับคำขอ
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3 py-2 fw-bold reject-req-btn shadow-sm">
                                    <i class="bi bi-x-lg me-1"></i>ปฏิเสธ
                                </button>
                            ` : ''}

                            ${(isAccepted && sale.item_type === 'rent' && !isReturning) ? `
                                <button type="button" class="btn btn-sm btn-outline-success rounded-pill px-3 py-2 fw-bold confirm-return-req-btn shadow-sm" title="กดยืนยันเมื่อได้รับของคืนเรียบร้อย">
                                    <i class="bi bi-box-arrow-in-left me-1"></i>✅ ยืนยันรับของคืน (นำเข้าสต็อก)
                                </button>
                            ` : ''}

                            ${isAccepted ? `
                                <button type="button" class="btn btn-sm btn-outline-danger rounded-pill px-3 py-2 fw-bold revoke-req-btn shadow-sm">
                                    <i class="bi bi-arrow-counterclockwise me-1"></i>ยกเลิกการจอง / ยึดของคืน
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        };

        let bodyHTML = '';
        if (totalActive === 0 && completedEntries.length === 0) {
            bodyHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">ยังไม่มีคำขอสำหรับรายการของคุณ</p>
                    <small class="text-muted">เมื่อมีผู้ใช้งานส่งคำขอนัดรับ ซื้อ หรือเช่าสินค้า รายการจะปรากฏขึ้นที่นี่โดยอัตโนมัติครับ</small>
                </div>
            `;
        } else {
            // หมวดที่ 0: ผู้เช่าแจ้งส่งคืนของแล้ว (Returning)
            if (returningEntries.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-info text-dark rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-truck me-1"></i>ผู้เช่าแจ้งส่งคืนของแล้ว รอคุณตรวจรับ (${returningEntries.length})
                            </span>
                        </div>
                        ${returningEntries.map(({ sale, req }) => renderSingleOrderCard(sale, req)).join('')}
                    </div>
                `;
            }

            // หมวดที่ 1: คำขอใหม่รอคุณตอบรับ (Pending)
            if (pendingEntries.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-bell-fill me-1"></i>คำขอใหม่รอคุณตอบรับ (${pendingEntries.length})
                            </span>
                        </div>
                        ${pendingEntries.map(({ sale, req }) => renderSingleOrderCard(sale, req)).join('')}
                    </div>
                `;
            }

            // หมวดที่ 2: รอนัดรับส่งมอบ (Accepted)
            if (acceptedEntries.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-success rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-box-seam me-1"></i>อยู่ระหว่างนัดรับ / กำลังส่งมอบ (${acceptedEntries.length})
                            </span>
                        </div>
                        ${acceptedEntries.map(({ sale, req }) => renderSingleOrderCard(sale, req)).join('')}
                    </div>
                `;
            }

            // หมวดที่ 3: ส่งมอบสำเร็จแล้ว (Completed) - จัดไว้ในหมวดประวัติ เรียงล่าสุดขึ้นก่อน
            if (completedEntries.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold text-secondary small">
                                <i class="bi bi-check2-circle text-success me-1"></i>ประวัติส่งมอบสำเร็จแล้ว (${completedEntries.length})
                            </span>
                            <button class="btn btn-sm btn-link text-decoration-none text-secondary p-0" type="button" data-bs-toggle="collapse" data-bs-target="#completedSalesList">
                                ดู/ซ่อน
                            </button>
                        </div>
                        <div class="collapse ${totalActive === 0 ? 'show' : ''}" id="completedSalesList">
                            ${completedEntries.map(({ sale, req }, idx) => renderSingleOrderCard(sale, req, { isLatest: idx === 0 })).join('')}
                        </div>
                    </div>
                `;
            }
        }

        document.getElementById('mySalesModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="mySalesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header bg-success text-white p-3">
                            <h5 class="modal-title fw-bold">
                                <i class="bi bi-box-seam me-2"></i>📦 การส่งมอบของฉัน (คนขาย)
                                ${totalActive > 0 ? `<span class="badge rounded-pill bg-danger ms-2" style="font-size: 0.78rem;">${totalActive} รายการที่ต้องดูแล</span>` : ''}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-3 p-md-4 bg-light">
                            ${bodyHTML}
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('mySalesModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

        // จัดการคลิก Action ภายใน Modal
        modalElement.addEventListener('click', async (e) => {
            const chatBtn = e.target.closest('.chat-requester-btn');
            if (chatBtn && typeof window.openChat === 'function') {
                modal.hide();
                window.openChat(chatBtn.dataset.requesterId, chatBtn.dataset.title, chatBtn.dataset.itemId);
                return;
            }

            const reqDiv = e.target.closest('[data-request-id]');
            if (!reqDiv) return;
            const requestId = reqDiv.dataset.requestId;

            if (e.target.closest('.confirm-return-req-btn')) {
                if (!confirm('ยืนยันว่าคุณได้รับสินค้าคืนในสภาพเรียบร้อยแล้วใช่หรือไม่?\n(ระบบจะนำสินค้าชิ้นนี้กลับเข้าสต็อก +1 ทันทีเพื่อให้ผู้อื่นเช่าต่อได้)')) return;
                const btn = e.target.closest('.confirm-return-req-btn');
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>กำลังบันทึก...';
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}/confirm-return`, {
                        method: 'PATCH'
                    });
                    alert(res.message || 'ตรวจรับสินค้าคืนเรียบร้อย นำสินค้ากลับเข้าสต็อกแล้ว');
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal();
                } catch(err) {
                    btn.disabled = false;
                    alert('ผิดพลาด: ' + err.message);
                }
            }

            if (e.target.closest('.accept-req-btn')) {
                if (!confirm('ยืนยันยอมรับคำขอนี้? (ของจะถูกจองให้คนนี้)')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' })
                    });
                    alert(res.message);
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal();
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }

            if (e.target.closest('.reject-req-btn')) {
                if (!confirm('ปฏิเสธคำขอนี้?')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' })
                    });
                    alert(res.message);
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal();
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }

            if (e.target.closest('.revoke-req-btn')) {
                if (!confirm('ยืนยันยึดของคืนและยกเลิกคำขอนี้? (กรณีคนซื้อไม่ยอมมารับของ)')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}/revoke`, {
                        method: 'PATCH'
                    });
                    alert(res.message);
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal();
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }
        });

    } catch (error) {
        alert('เปิดหน้าต่างไม่สำเร็จ: ' + error.message);
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mySalesOpenBtn');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openMySalesModal === 'function') {
                window.openMySalesModal();
            }
        });
    }
});
