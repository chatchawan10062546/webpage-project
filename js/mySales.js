// ====================================================
// 📊 mySales.js : หน้าต่างการส่งมอบของฉัน (สำหรับคนขาย / ผู้แจก)
// ดีไซน์ใหม่: สบายตา อ่านง่าย แยกหมวดหมู่ชัดเจน ไม่ซ้อนกล่อง
// ====================================================

window.openMySalesModal = async () => {
    function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
    function getUserId() { const u = getUser(); return u?.id || u?.user_id || u?.userId; }

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

        // จำแนกหมวดหมู่ฝั่งคนขาย
        const returningSales = []; // มีผู้เช่าส่งคืนของรอตรวจรับ (status === 'returning')
        const pendingSales = [];   // มีคำขอรอตอบรับ (status === 'pending')
        const acceptedSales = [];  // รอนัดรับส่งมอบ/อยู่ระหว่างเช่า (status === 'accepted' || status === 'renting')
        const completedSales = []; // ส่งมอบเรียบร้อยแล้ว/คืนแล้ว (status === 'completed' || status === 'returned')
        const emptySales = [];     // ยังไม่มีคำขอ

        sales.forEach(sale => {
            const reqs = sale.requests || [];
            if (reqs.length === 0) {
                emptySales.push(sale);
            } else {
                const hasReturning = reqs.some(r => r.status === 'returning');
                const hasPending = reqs.some(r => r.status === 'pending');
                const hasAccepted = reqs.some(r => r.status === 'accepted' || r.status === 'renting');
                const hasCompleted = reqs.some(r => r.status === 'completed' || r.status === 'returned');

                if (hasReturning) {
                    returningSales.push(sale);
                } else if (hasPending) {
                    pendingSales.push(sale);
                } else if (hasAccepted) {
                    acceptedSales.push(sale);
                } else if (hasCompleted) {
                    completedSales.push(sale);
                } else {
                    emptySales.push(sale);
                }
            }
        });

        const totalActive = returningSales.length + pendingSales.length + acceptedSales.length;

        // ฟังก์ชันสร้างการ์ดคำขอฝั่งคนขาย (Clean Order Card Design)
        const renderSellerItemCard = (sale, filterStatus = null) => {
            const typeBadge = sale.item_type === 'sell' 
                ? `<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1">ขาย ฿${Number(sale.price).toLocaleString()}</span>`
                : sale.item_type === 'rent'
                ? `<span class="badge bg-warning-subtle text-dark border border-warning-subtle rounded-pill px-2 py-1">ให้เช่า ฿${Number(sale.price).toLocaleString()}/วัน</span>`
                : `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1">แจกฟรี</span>`;

            const matchedRequests = filterStatus 
                ? (sale.requests || []).filter(r => {
                    if (filterStatus === 'accepted') return r.status === 'accepted' || r.status === 'renting';
                    if (filterStatus === 'completed') return r.status === 'completed' || r.status === 'returned';
                    return r.status === filterStatus;
                })
                : (sale.requests || []);

            if (matchedRequests.length === 0 && filterStatus) return '';

            return matchedRequests.map(req => {
                const isReturning = req.status === 'returning';
                const isAccepted = req.status === 'accepted' || req.status === 'renting';
                const isPending = req.status === 'pending';
                const isCompleted = req.status === 'completed' || req.status === 'returned';

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

                return `
                    <div class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden bg-white my-sale-card" data-item-id="${sale.item_id}">
                        <!-- แถบบน: สถานะคำขอ & ประเภทสินค้า -->
                        <div class="px-3 py-2 d-flex justify-content-between align-items-center ${headerBg}">
                            <div class="fw-bold small d-flex align-items-center">
                                ${headerIcon}<span>${headerTitle}</span>
                            </div>
                            <div>${typeBadge}</div>
                        </div>

                        <div class="p-3">
                            <!-- แถวสินค้า: รูป + ชื่อ + จำนวน -->
                            <div class="d-flex align-items-center gap-3 mb-3">
                                <img src="${sale.image_url || '/assets/pansuk_icon.jpg'}" 
                                     class="rounded-3 shadow-sm flex-shrink-0" style="width: 56px; height: 56px; object-fit: cover;">
                                <div class="flex-grow-1 min-width-0">
                                    <h6 class="fw-bold mb-1 text-dark text-truncate fs-6">${escapeHtml(sale.title)}</h6>
                                    <div class="small text-muted">
                                        คงเหลือ: <strong>${sale.quantity}</strong> ชิ้น
                                        ${sale.quantity <= 0 ? '<span class="badge bg-danger-subtle text-danger ms-1">จอง/หมดแล้ว</span>' : ''}
                                    </div>
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
            }).join('');
        };

        let bodyHTML = '';
        if (sales.length === 0) {
            bodyHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-box-seam fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">คุณยังไม่ได้ลงประกาศรายการใดๆ สำหรับขายหรือแจก</p>
                    <small class="text-muted">หากต้องการลงประกาศ สามารถกดปุ่ม "ลงประกาศแจกของ" ได้ที่เมนูด้านบนครับ</small>
                </div>
            `;
        } else {
            // หมวดที่ 0: ผู้เช่าแจ้งส่งคืนของแล้ว (Returning)
            if (returningSales.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-info text-dark rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-truck me-1"></i>ผู้เช่าแจ้งส่งคืนของแล้ว รอคุณตรวจรับ (${returningSales.length})
                            </span>
                        </div>
                        ${returningSales.map(s => renderSellerItemCard(s, 'returning')).join('')}
                    </div>
                `;
            }

            // หมวดที่ 1: คำขอใหม่รอคุณตอบรับ (Pending)
            if (pendingSales.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-bell-fill me-1"></i>คำขอใหม่รอคุณตอบรับ (${pendingSales.length})
                            </span>
                        </div>
                        ${pendingSales.map(s => renderSellerItemCard(s, 'pending')).join('')}
                    </div>
                `;
            }

            // หมวดที่ 2: รอนัดรับส่งมอบ (Accepted)
            if (acceptedSales.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <span class="badge bg-success rounded-pill px-3 py-2 fw-bold fs-6">
                                <i class="bi bi-box-seam me-1"></i>อยู่ระหว่างนัดรับ / กำลังส่งมอบ (${acceptedSales.length})
                            </span>
                        </div>
                        ${acceptedSales.map(s => renderSellerItemCard(s, 'accepted')).join('')}
                    </div>
                `;
            }

            // หมวดที่ 3: ส่งมอบสำเร็จแล้ว (Completed) - จัดไว้ในหมวดประวัติ
            if (completedSales.length > 0) {
                bodyHTML += `
                    <div class="mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="fw-bold text-secondary small">
                                <i class="bi bi-check2-circle text-success me-1"></i>ประวัติส่งมอบสำเร็จแล้ว (${completedSales.length})
                            </span>
                            <button class="btn btn-sm btn-link text-decoration-none text-secondary p-0" type="button" data-bs-toggle="collapse" data-bs-target="#completedSalesList">
                                ดู/ซ่อน
                            </button>
                        </div>
                        <div class="collapse" id="completedSalesList">
                            ${completedSales.map(s => renderSellerItemCard(s, 'completed')).join('')}
                        </div>
                    </div>
                `;
            }

            // หมวดที่ 4: รายการที่ยังไม่มีคำขอ
            if (emptySales.length > 0) {
                bodyHTML += `
                    <div class="mt-4 pt-3 border-top">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted fw-bold small">
                                <i class="bi bi-shop me-1"></i>รายการอื่นๆ ของคุณที่ยังไม่มีคำขอ (${emptySales.length})
                            </span>
                            <button class="btn btn-sm btn-link text-decoration-none text-secondary p-0" type="button" data-bs-toggle="collapse" data-bs-target="#emptySalesList">
                                ดู/ซ่อน
                            </button>
                        </div>
                        <div class="collapse ${totalActive === 0 ? 'show' : ''}" id="emptySalesList">
                            <div class="row g-2">
                                ${emptySales.map(sale => `
                                    <div class="col-12 col-md-6">
                                        <div class="border rounded-3 p-2 bg-white d-flex align-items-center gap-2 shadow-sm">
                                            <img src="${sale.image_url || '/assets/pansuk_icon.jpg'}" 
                                                 class="rounded-2" style="width: 44px; height: 44px; object-fit: cover;">
                                            <div class="flex-grow-1 min-width-0">
                                                <div class="fw-bold text-dark text-truncate small">${escapeHtml(sale.title)}</div>
                                                <div class="text-muted" style="font-size: 0.75rem;">เหลือ ${sale.quantity} ชิ้น • ยังไม่มีคำขอ</div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
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
