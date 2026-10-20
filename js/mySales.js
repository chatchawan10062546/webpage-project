// ====================================================
// 📊 mySales.js : หน้าต่างการส่งมอบและการนัดรับของฉัน (Seller & Buyer)
// ====================================================

window.openMySalesModal = async (initialTab = null) => {
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

    try {
        // ดึงทั้งข้อมูลฝั่งคนขาย (/api/my-sales) และฝั่งคนซื้อ (/api/my-requests) พร้อมกัน
        const [salesData, requestsData] = await Promise.all([
            requestJson('/api/my-sales').catch(() => ({ sales: [] })),
            requestJson('/api/my-requests').catch(() => ({ requests: [] }))
        ]);

        const sales = salesData.sales || [];
        const buyerRequests = requestsData.requests || [];

        // นับจำนวนที่ต้องดำเนินการ
        const pendingSalesCount = sales.reduce((acc, s) => acc + (s.requests ? s.requests.filter(r => r.status === 'pending').length : 0), 0);
        const activeHandoversCount = sales.reduce((acc, s) => acc + (s.requests ? s.requests.filter(r => r.status === 'accepted').length : 0), 0);
        const activeBuyerCount = buyerRequests.filter(r => r.status === 'pending' || r.status === 'accepted').length;

        // เลือกว่าจะแสดงแท็บไหนก่อน:
        // ถ้าผู้ใช้มีคำขอที่กดไป (คนซื้อ) และไม่มีของขาย ให้เปิดแท็บคนซื้อทันที
        let defaultTab = initialTab;
        if (!defaultTab) {
            if (sales.length === 0 && buyerRequests.length > 0) {
                defaultTab = 'buyer';
            } else {
                defaultTab = 'seller';
            }
        }

        // ==========================================
        // 1. สร้าง HTML ฝั่งคนขาย (Seller Tab)
        // ==========================================
        let sellerHTML = '';
        if (sales.length === 0) {
            sellerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-box-seam fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">คุณยังไม่ได้ลงประกาศรายการใดๆ สำหรับขายหรือแจก</p>
                    <small class="text-muted">หากต้องการลงประกาศ สามารถกดปุ่ม "ลงประกาศแจกของ" ได้ที่เมนูด้านบนครับ</small>
                </div>
            `;
        } else {
            // แยกรายการที่มีคำขอ กับรายการที่ยังไม่มีคำขอ
            const salesWithReqs = sales.filter(s => s.requests && s.requests.length > 0);
            const salesWithoutReqs = sales.filter(s => !s.requests || s.requests.length === 0);

            const renderSaleCard = (sale) => {
                const typeTag = sale.item_type === 'sell' 
                    ? `<span class="badge bg-primary me-1">ขาย (฿${Number(sale.price).toLocaleString()})</span>`
                    : sale.item_type === 'rent'
                    ? `<span class="badge bg-warning text-dark me-1">ให้เช่า (฿${Number(sale.price).toLocaleString()}/วัน)</span>`
                    : `<span class="badge bg-success me-1">แจกฟรี</span>`;

                const stockLabel = sale.quantity > 0 
                    ? `<span class="badge bg-info text-dark">เหลือ ${sale.quantity} ชิ้น</span>` 
                    : `<span class="badge bg-danger">หมด/จองแล้ว</span>`;

                let requestsHTML = '';
                if (!sale.requests || sale.requests.length === 0) {
                    requestsHTML = '<p class="text-muted small mb-0 py-2 text-center">ยังไม่มีผู้ส่งคำขอในขณะนี้</p>';
                } else {
                    requestsHTML = sale.requests.map(req => {
                        const isAccepted = req.status === 'accepted';
                        const isPending = req.status === 'pending';
                        const isCompleted = req.status === 'completed';

                        let statusBadge = '<span class="badge bg-secondary">สถานะ: ' + req.status + '</span>';
                        if (isPending) statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>รอการตอบรับ</span>';
                        else if (isAccepted) statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>ยอมรับแล้ว (รอนัดรับ/ส่งมอบ)</span>';
                        else if (isCompleted) statusBadge = '<span class="badge bg-primary"><i class="bi bi-patch-check-fill me-1"></i>ส่งมอบสำเร็จแล้ว</span>';

                        return `
                            <div class="border rounded-3 p-3 mb-2 bg-white d-flex flex-column gap-2 shadow-sm ${isAccepted ? 'border-success border-2' : ''}" data-request-id="${req.request_id}">
                                <div class="d-flex justify-content-between align-items-center flex-wrap gap-1">
                                    <span class="fw-bold text-dark"><i class="bi bi-person-circle text-primary me-1"></i>${escapeHtml(req.requester_name || 'ผู้ใช้งาน')}</span>
                                    <div>
                                        ${req.requester_phone ? `<a href="tel:${req.requester_phone}" class="badge bg-light text-dark border text-decoration-none me-1"><i class="bi bi-telephone me-1 text-success"></i>${escapeHtml(req.requester_phone)}</a>` : ''}
                                        ${statusBadge}
                                    </div>
                                </div>
                                <div class="small text-secondary bg-light p-2 rounded-2 border">
                                    💬 "${escapeHtml(req.message || 'สนใจรายการนี้ครับ/ค่ะ')}"
                                </div>
                                <div class="d-flex gap-2 mt-1 flex-wrap">
                                    <button class="btn btn-sm btn-outline-primary flex-grow-1 fw-bold chat-requester-btn" 
                                            data-requester-id="${req.requester_id}" data-item-id="${sale.item_id}" data-title="${escapeHtml(sale.title)}">
                                        💬 แชตกับผู้ซื้อ
                                    </button>
                                    ${isPending ? `
                                        <button class="btn btn-sm btn-success flex-grow-1 fw-bold accept-req-btn">✅ ยอมรับคำขอ</button>
                                        <button class="btn btn-sm btn-outline-danger flex-grow-1 reject-req-btn">❌ ปฏิเสธ</button>
                                    ` : ''}
                                    ${isAccepted ? `
                                        <button class="btn btn-sm btn-outline-danger flex-grow-1 fw-bold revoke-req-btn">🛑 ยกเลิกการจอง / ยึดของคืน</button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                return `
                    <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden my-sale-card" data-item-id="${sale.item_id}">
                        <div class="card-header bg-white p-3 border-bottom d-flex gap-3 align-items-center">
                            <img src="${sale.image_url || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80'}" 
                                 class="rounded-3 shadow-sm flex-shrink-0" style="width: 65px; height: 65px; object-fit: cover;">
                            <div class="flex-grow-1 min-width-0">
                                <h6 class="fw-bold mb-1 fs-6 text-truncate">${escapeHtml(sale.title)}</h6>
                                <div class="d-flex align-items-center gap-1">${typeTag} ${stockLabel}</div>
                            </div>
                        </div>
                        <div class="card-body p-3 bg-light">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 class="fw-bold text-dark mb-0 small">📋 รายการคำขอ (${(sale.requests || []).length}):</h6>
                            </div>
                            ${requestsHTML}
                        </div>
                    </div>
                `;
            };

            if (salesWithReqs.length > 0) {
                sellerHTML += `
                    <div class="mb-3">
                        <div class="fw-bold text-success mb-2"><i class="bi bi-bell-fill me-1"></i>รายการที่มีผู้ส่งคำขอหรือกำลังส่งมอบ (${salesWithReqs.length})</div>
                        ${salesWithReqs.map(renderSaleCard).join('')}
                    </div>
                `;
            }

            if (salesWithoutReqs.length > 0) {
                sellerHTML += `
                    <div class="mt-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="text-muted fw-bold small"><i class="bi bi-box me-1"></i>รายการอื่นๆ ที่ยังไม่มีคำขอ (${salesWithoutReqs.length})</span>
                            <button class="btn btn-sm btn-link text-decoration-none p-0 text-secondary" type="button" data-bs-toggle="collapse" data-bs-target="#emptySalesList">
                                ดู/ซ่อน
                            </button>
                        </div>
                        <div class="collapse ${salesWithReqs.length === 0 ? 'show' : ''}" id="emptySalesList">
                            ${salesWithoutReqs.map(renderSaleCard).join('')}
                        </div>
                    </div>
                `;
            }
        }

        // ==========================================
        // 2. สร้าง HTML ฝั่งคนซื้อ (Buyer Tab)
        // ==========================================
        let buyerHTML = '';
        if (buyerRequests.length === 0) {
            buyerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">คุณยังไม่ได้ส่งคำขอรับของหรือรายการใดๆ</p>
                    <small class="text-muted">ลองเลือกรายการสิ่งของที่คุณสนใจบนหน้าแรกแล้วกด "ขอรับของ" ดูสิครับ!</small>
                </div>
            `;
        } else {
            buyerHTML = buyerRequests.map(req => {
                let statusBadge = '';
                if (req.status === 'accepted') {
                    statusBadge = '<span class="badge bg-warning text-dark px-3 py-2 rounded-pill"><i class="bi bi-box-seam me-1"></i>ผู้ขายอนุมัติแล้ว (รอนัดรับของ)</span>';
                } else if (req.status === 'completed') {
                    statusBadge = '<span class="badge bg-success px-3 py-2 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>ได้รับของเรียบร้อยแล้ว</span>';
                } else if (req.status === 'rejected') {
                    statusBadge = '<span class="badge bg-danger px-3 py-2 rounded-pill"><i class="bi bi-x-circle me-1"></i>ถูกปฏิเสธ</span>';
                } else if (req.status === 'cancelled') {
                    statusBadge = '<span class="badge bg-secondary px-3 py-2 rounded-pill">ยกเลิกแล้ว</span>';
                } else {
                    statusBadge = '<span class="badge bg-info text-dark px-3 py-2 rounded-pill"><i class="bi bi-hourglass-split me-1"></i>รอผู้ขายตอบรับ</span>';
                }

                const typeTag = req.item_type === 'sell' 
                    ? `<span class="badge bg-primary me-1">ขาย (฿${Number(req.price).toLocaleString()})</span>`
                    : req.item_type === 'rent'
                    ? `<span class="badge bg-warning text-dark me-1">ให้เช่า (฿${Number(req.price).toLocaleString()}/วัน)</span>`
                    : `<span class="badge bg-success me-1">แจกฟรี</span>`;

                return `
                    <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden my-request-card" data-request-id="${req.request_id}">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom flex-wrap gap-1">
                                <div>${typeTag}</div>
                                <div>${statusBadge}</div>
                            </div>
                            <div class="d-flex gap-3 align-items-start mb-2">
                                <img src="${req.item_image || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80'}" 
                                     class="rounded-3 shadow-sm flex-shrink-0" style="width: 70px; height: 70px; object-fit: cover;">
                                <div class="flex-grow-1 min-width-0">
                                    <h6 class="fw-bold mb-1 text-dark" style="font-size: 1rem; line-height: 1.35;">${escapeHtml(req.item_title)}</h6>
                                    <div class="small text-muted mb-1">
                                        ผู้ขาย/ผู้แจก: <strong class="text-dark">${escapeHtml(req.owner_name)}</strong>
                                        ${req.owner_phone ? `<span class="ms-2 badge bg-light text-dark border"><i class="bi bi-telephone me-1 text-success"></i>${escapeHtml(req.owner_phone)}</span>` : ''}
                                    </div>
                                    <div class="small text-muted" style="font-size: 0.78rem;">
                                        <i class="bi bi-clock me-1"></i>${new Date(req.created_at).toLocaleDateString('th-TH')} ${new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                                    </div>
                                </div>
                            </div>

                            ${req.message ? `
                                <div class="small text-secondary bg-light p-2 rounded-3 mb-2 border">
                                    💬 <i>"${escapeHtml(req.message)}"</i>
                                </div>
                            ` : ''}

                            <div class="d-flex gap-2 align-items-center mt-2 pt-2 border-top flex-wrap">
                                ${(req.status === 'pending' || req.status === 'accepted') ? `
                                    <button type="button" class="btn btn-success btn-sm rounded-pill py-2 px-3 fw-bold flex-grow-1 confirm-received-btn shadow-sm" style="font-size: 0.85rem; white-space: nowrap;">
                                        ✅ ยืนยันได้รับของแล้ว
                                    </button>
                                ` : ''}

                                <button type="button" class="btn btn-outline-primary btn-sm rounded-pill py-2 px-3 fw-bold flex-grow-1 buyer-chat-btn shadow-sm"
                                        data-owner-id="${req.owner_id}" data-item-id="${req.item_id}" data-title="${escapeHtml(req.item_title)}" style="font-size: 0.85rem; white-space: nowrap;">
                                    💬 แชตคุย
                                </button>

                                ${req.status === 'pending' ? `
                                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill py-2 px-3 fw-bold flex-grow-1 cancel-req-btn shadow-sm" style="font-size: 0.85rem; white-space: nowrap;">
                                        ❌ ยกเลิกคำขอ
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // ==========================================
        // 3. Render Modal With Tabs
        // ==========================================
        document.getElementById('mySalesModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="mySalesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header bg-success text-white p-3">
                            <h5 class="modal-title fw-bold"><i class="bi bi-box-seam me-2"></i>การส่งมอบและนัดรับของฉัน</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        <!-- Nav Tabs -->
                        <div class="bg-white border-bottom px-3 pt-2">
                            <ul class="nav nav-pills nav-fill gap-2" id="deliveryTab" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link rounded-pill fw-bold py-2 ${defaultTab === 'seller' ? 'active' : ''}" 
                                            id="seller-tab" data-bs-toggle="pill" data-bs-target="#seller-pane" type="button" role="tab">
                                        📦 ฉันส่งมอบ (คนขาย/แจก) 
                                        ${(pendingSalesCount + activeHandoversCount) > 0 ? `<span class="badge rounded-pill bg-danger ms-1">${pendingSalesCount + activeHandoversCount}</span>` : ''}
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link rounded-pill fw-bold py-2 ${defaultTab === 'buyer' ? 'active' : ''}" 
                                            id="buyer-tab" data-bs-toggle="pill" data-bs-target="#buyer-pane" type="button" role="tab">
                                        📥 ฉันนัดรับของ (คนซื้อ/รับ)
                                        ${activeBuyerCount > 0 ? `<span class="badge rounded-pill bg-danger ms-1">${activeBuyerCount}</span>` : ''}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div class="modal-body p-4 bg-light">
                            <div class="tab-content" id="deliveryTabContent">
                                <div class="tab-pane fade ${defaultTab === 'seller' ? 'show active' : ''}" id="seller-pane" role="tabpanel">
                                    ${sellerHTML}
                                </div>
                                <div class="tab-pane fade ${defaultTab === 'buyer' ? 'show active' : ''}" id="buyer-pane" role="tabpanel">
                                    ${buyerHTML}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('mySalesModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

        // Event Delegations
        modalElement.addEventListener('click', async (e) => {
            // แชตฝั่งคนขาย
            const chatBtn = e.target.closest('.chat-requester-btn');
            if (chatBtn && typeof window.openChat === 'function') {
                modal.hide();
                window.openChat(chatBtn.dataset.requesterId, chatBtn.dataset.title, chatBtn.dataset.itemId);
                return;
            }

            // แชตฝั่งคนซื้อ
            const buyerChatBtn = e.target.closest('.buyer-chat-btn');
            if (buyerChatBtn && typeof window.openChat === 'function') {
                modal.hide();
                window.openChat(buyerChatBtn.dataset.ownerId, buyerChatBtn.dataset.title, buyerChatBtn.dataset.itemId);
                return;
            }

            // คำขอฝั่งคนขาย
            const reqDiv = e.target.closest('[data-request-id]');
            if (!reqDiv) return;
            const requestId = reqDiv.dataset.requestId;

            if (e.target.closest('.accept-req-btn')) {
                if (!confirm('ยืนยันยอมรับคำขอนี้? (ของจะถูกจองให้คนนี้)')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' })
                    });
                    alert(res.message);
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal('seller');
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
                    modal.hide(); window.openMySalesModal('seller');
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
                    modal.hide(); window.openMySalesModal('seller');
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }

            // คำขอฝั่งคนซื้อ: ยืนยันได้รับของ
            if (e.target.closest('.confirm-received-btn')) {
                if (!confirm('ยืนยันว่าคุณได้รับของรายการนี้เรียบร้อยแล้วใช่หรือไม่?')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}/confirm-received`, {
                        method: 'PATCH'
                    });
                    alert(res.message || 'ยืนยันได้รับของเรียบร้อยแล้ว ขอบคุณที่ร่วมแบ่งปันครับ!');
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal('buyer');
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }

            // คำขอฝั่งคนซื้อ: ยกเลิกคำขอ
            if (e.target.closest('.cancel-req-btn')) {
                if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำขอนี้?')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}/cancel`, {
                        method: 'DELETE'
                    });
                    alert(res.message || 'ยกเลิกคำขอเรียบร้อยแล้ว');
                    if (typeof window.updateAllNavBadges === 'function') window.updateAllNavBadges();
                    modal.hide(); window.openMySalesModal('buyer');
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
                window.openMySalesModal('seller');
            }
        });
    }

    const reqBtn = document.getElementById('myRequestsOpenBtn');
    if (reqBtn) {
        reqBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.openMySalesModal === 'function') {
                window.openMySalesModal('buyer');
            }
        });
    }
});
