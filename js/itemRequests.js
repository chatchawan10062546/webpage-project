// ====================================================
// 🤝 itemRequests.js : ส่งและจัดการคำขอรับรายการ
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');
    if (!itemGrid) return;

    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getUser();
        return user?.id || user?.user_id || user?.userId;
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    window.submitItemRequest = async (itemId, action, customMessage) => {
        const userId = getUserId();
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอรับของ');
            return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' };
        }

        const message = customMessage || 'สนใจรายการนี้ครับ/ค่ะ';

        try {
            await requestJson(`http://localhost:3000/api/items/${itemId}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: userId, message, action })
            });
            return { success: true, message: 'ส่งคำขอสำเร็จ' };
        } catch (error) {
            if (error.message && error.message.includes('เคยส่งคำขอ')) {
                return { success: false, isDuplicate: true, message: 'คุณเคยส่งคำขอรายการนี้ไปแล้ว' };
            }
            return { success: false, isDuplicate: false, message: error.message };
        }
    };

    window.openSubmitRequestModal = (item) => {
        document.getElementById('submitRequestModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="submitRequestModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-chat-left-text me-2"></i>ข้อความถึงผู้ขาย</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <label class="form-label fw-bold">ฝากข้อความถึงผู้ขาย (เช่น วันเวลาที่สะดวกรับของ, ต่อราคา)</label>
                            <textarea id="requestMessageInput" class="form-control" rows="3" placeholder="สนใจรายการนี้ครับ/ค่ะ สะดวกรับวันไหนดีครับ..."></textarea>
                            <button type="button" class="btn btn-success w-100 mt-4 py-2 fw-bold" id="confirmSubmitRequestBtn">
                                ส่งคำขอรับของ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
        
        const modalElement = document.getElementById('submitRequestModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

        document.getElementById('confirmSubmitRequestBtn').addEventListener('click', async () => {
            const btn = document.getElementById('confirmSubmitRequestBtn');
            const msgInput = document.getElementById('requestMessageInput').value || 'สนใจรายการนี้ครับ/ค่ะ';
            
            btn.disabled = true;
            btn.innerHTML = '⏳ กำลังส่งคำขอ...';
            
            const res = await window.submitItemRequest(item.itemId, 'free', msgInput);
            
            modal.hide();
            
            // This expects itemDetailModal's request-options button to handle it, but wait:
            // Since this runs asynchronously and outside item.js event listener, we should notify item.js or show a toast directly.
            if (res && res.success) {
                alert('✅ ส่งคำขอสำเร็จเรียบร้อย! สามารถตรวจสอบได้ที่เมนู "คำขอของฉัน"');
            } else if (res && res.isDuplicate) {
                alert('⚠️ คุณเคยส่งคำขอรายการนี้ไปแล้ว! สามารถติดตามสถานะได้ที่เมนู "คำขอของฉัน"');
            } else {
                alert('❌ ส่งคำขอไม่สำเร็จ: ' + (res?.message || 'เกิดข้อผิดพลาด'));
            }
        });
    };

    window.showRequestOptions = (item) => {
        window.submitItemRequest(item.itemId, 'free');
    };

    function showRequests(card) {
        const itemId = card.dataset.itemId;
        const userId = getUserId();
        requestJson(`http://localhost:3000/api/items/${itemId}/requests?user_id=${encodeURIComponent(userId)}`)
            .then(data => {
                const rows = data.requests.map(request => `
                    <div class="border rounded p-3 mb-2 request-row" data-request-id="${request.request_id}">
                        <div class="fw-bold">${request.requester_name}</div>
                        <div class="small text-muted">${request.requester_email} ${request.requester_phone || ''}</div>
                        <p class="mb-2 mt-2">${request.message || 'ไม่ได้ฝากข้อความ'}</p>
                        <span class="badge text-bg-secondary">${request.status}</span>
                        ${request.status === 'pending' ? `
                            <button class="btn btn-sm btn-success ms-2 request-accept-btn" type="button">ยอมรับ</button>
                            <button class="btn btn-sm btn-outline-danger request-reject-btn" type="button">ปฏิเสธ</button>
                        ` : ''}
                    </div>
                `).join('') || '<p class="text-muted mb-0">ยังไม่มีคำขอรับของ</p>';

                document.body.insertAdjacentHTML('beforeend', `
                    <div class="modal fade" id="itemRequestsModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">คำขอรับของ</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">${rows}</div>
                            </div>
                        </div>
                    </div>
                `);

                const modalElement = document.getElementById('itemRequestsModal');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
                modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

                modalElement.addEventListener('click', event => {
                    const acceptButton = event.target.closest('.request-accept-btn');
                    const rejectButton = event.target.closest('.request-reject-btn');
                    if (!acceptButton && !rejectButton) return;
                    const row = event.target.closest('.request-row');
                    const status = acceptButton ? 'accepted' : 'rejected';
                    requestJson(`http://localhost:3000/api/item-requests/${row.dataset.requestId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status, user_id: userId })
                    }).then(() => location.reload())
                        .catch(error => alert('จัดการคำขอไม่สำเร็จ: ' + error.message));
                });
            })
            .catch(error => alert('ดึงคำขอไม่สำเร็จ: ' + error.message));
    }

    itemGrid.addEventListener('click', event => {
        const button = event.target.closest('.item-requests-btn');
        const card = event.target.closest('.item-element');
        if (button && card) showRequests(card);
    });
});

window.openMyRequestsModal = async () => {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }
    function getUserId() {
        const user = getUser();
        return user?.id || user?.user_id || user?.userId;
    }
    async function requestJson(url, options = {}) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    const userId = getUserId();
    if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนดูคำขอของคุณ');

    try {
        const data = await requestJson('http://localhost:3000/api/my-requests');
        const requests = data.requests || [];
        let rowsHTML = '';
        
        if (requests.length === 0) {
            rowsHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">คุณยังไม่ได้ส่งคำขอรับรายการใดๆ</p>
                    <small class="text-muted">ลองเลือกกดดูรายละเอียดสินค้าที่ชอบแล้วส่งคำขอหาผู้แจกดูสิ!</small>
                </div>
            `;
        } else {
            rowsHTML = requests.map(req => {
                let statusBadge = '';
                if (req.status === 'accepted') {
                    statusBadge = '<span class="badge bg-warning text-dark px-3 py-2 rounded-pill"><i class="bi bi-box-seam me-1"></i>ผู้ขายอนุมัติแล้ว (รอรับของ)</span>';
                } else if (req.status === 'completed') {
                    statusBadge = '<span class="badge bg-success px-3 py-2 rounded-pill"><i class="bi bi-check-circle-fill me-1"></i>ได้รับของเรียบร้อยแล้ว</span>';
                } else if (req.status === 'rejected') {
                    statusBadge = '<span class="badge bg-danger px-3 py-2 rounded-pill"><i class="bi bi-x-circle me-1"></i>ถูกปฏิเสธ</span>';
                } else if (req.status === 'cancelled') {
                    statusBadge = '<span class="badge bg-secondary px-3 py-2 rounded-pill">ยกเลิกแล้ว</span>';
                } else {
                    statusBadge = '<span class="badge bg-info text-dark px-3 py-2 rounded-pill"><i class="bi bi-send-check me-1"></i>ส่งคำขอเรียบร้อยแล้ว</span>';
                }

                const typeTag = req.item_type === 'sell' 
                    ? `<span class="badge bg-primary me-1">ขาย (฿${Number(req.price).toLocaleString()})</span>`
                    : req.item_type === 'rent'
                    ? `<span class="badge bg-warning text-dark me-1">ให้เช่า (฿${Number(req.price).toLocaleString()}/วัน)</span>`
                    : `<span class="badge bg-success me-1">แจกฟรี</span>`;

                return `
                    <div class="card mb-3 border-0 shadow-sm rounded-4 overflow-hidden my-request-card" data-request-id="${req.request_id}">
                        <div class="card-body p-3">
                            <div class="d-flex gap-3 align-items-center">
                                <img src="${req.item_image || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80'}" 
                                     class="rounded-3" style="width: 85px; height: 85px; object-fit: cover;">
                                <div class="flex-grow-1 min-width-0">
                                    <div class="d-flex justify-content-between align-items-start mb-1">
                                        <h6 class="fw-bold mb-0 text-truncate fs-5">${req.item_title}</h6>
                                        ${statusBadge}
                                    </div>
                                    <div class="small text-muted mb-1">
                                        ${typeTag} เจ้าของ: <span class="fw-bold text-dark">${req.owner_name}</span>
                                    </div>
                                    <div class="small text-secondary bg-white p-2 rounded-3 mb-2 border">
                                        💬 <i>"${req.message || 'ไม่ได้ฝากข้อความ'}"</i>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center small text-muted">
                                        <span><i class="bi bi-clock me-1"></i>${new Date(req.created_at).toLocaleDateString('th-TH')} ${new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                                        <div class="d-flex gap-2">
                                            ${(req.status === 'pending' || req.status === 'accepted') ? `
                                                <button type="button" class="btn btn-success btn-sm rounded-pill px-3 fw-bold confirm-received-btn">
                                                    ✅ ยืนยันได้รับของแล้ว
                                                </button>
                                            ` : ''}
                                            ${typeof window.openChat === 'function' ? `
                                                <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-3 chat-owner-btn" 
                                                        data-owner-id="${req.owner_id}" data-item-id="${req.item_id}" data-title="${req.item_title}">
                                                    💬 แชตคุย
                                                </button>
                                            ` : ''}
                                            ${req.status === 'pending' ? `
                                                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-3 cancel-request-btn">
                                                    ❌ ยกเลิกคำขอ
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('myRequestsModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="myRequestsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header bg-success text-white p-3">
                            <h5 class="modal-title fw-bold"><i class="bi bi-send-check me-2"></i>คำขอของฉัน (My Requests)</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light" style="max-height: 75vh; overflow-y: auto;">
                            ${rowsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('myRequestsModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

        modalElement.addEventListener('click', async (e) => {
            const chatBtn = e.target.closest('.chat-owner-btn');
            const cancelBtn = e.target.closest('.cancel-request-btn');
            const confirmBtn = e.target.closest('.confirm-received-btn');
            const card = e.target.closest('.my-request-card');

            if (chatBtn && typeof window.openChat === 'function') {
                modal.hide();
                window.openChat(chatBtn.dataset.ownerId, chatBtn.dataset.title, chatBtn.dataset.itemId);
            }

            if (confirmBtn && card) {
                if (!confirm('คุณได้รับสินค้า/ของแจกรายการนี้เรียบร้อยแล้วใช่หรือไม่?')) return;
                const requestId = card.dataset.requestId;
                confirmBtn.disabled = true;
                try {
                    const result = await requestJson(`http://localhost:3000/api/item-requests/${requestId}/confirm-received`, {
                        method: 'PATCH'
                    });
                    modal.hide();
                    if (window.openReviewModal) {
                        window.openReviewModal(result.item_id, result.owner_id, result.owner_name, result.item_title);
                    } else {
                        alert(result.message);
                    }
                } catch (err) {
                    confirmBtn.disabled = false;
                    alert('ดำเนินการไม่สำเร็จ: ' + err.message);
                }
            }

            if (cancelBtn && card) {
                if (!confirm('ต้องการยกเลิกคำขอนี้ใช่หรือไม่?')) return;
                const requestId = card.dataset.requestId;
                try {
                    await requestJson(`http://localhost:3000/api/item-requests/${requestId}/cancel`, {
                        method: 'DELETE'
                    });
                    alert('ยกเลิกคำขอสำเร็จ');
                    card.remove();
                } catch (err) {
                    alert('ยกเลิกคำขอไม่สำเร็จ: ' + err.message);
                }
            }
        });

    } catch (error) {
        alert('เปิดหน้าคำขอของฉันไม่สำเร็จ: ' + error.message);
    }
};

document.addEventListener('click', (e) => {
    const myRequestsBtn = e.target.closest('#myRequestsOpenBtn');
    if (myRequestsBtn) {
        e.preventDefault();
        window.openMyRequestsModal();
    }
});
