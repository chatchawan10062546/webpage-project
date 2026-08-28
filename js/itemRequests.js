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

    window.submitItemRequest = async (itemId, action) => {
        const userId = getUserId();
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอรับของ');
            return;
        }

        const message = prompt('ฝากข้อความถึงผู้ประกาศ (กด Cancel เพื่อยกเลิก):', 'สนใจรายการนี้ครับ/ค่ะ');
        if (message === null) return;

        try {
            await requestJson(`http://localhost:3000/api/items/${itemId}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requester_id: userId, message, action })
            });
            alert('ส่งคำขอรับของสำเร็จ รอผู้ประกาศตอบรับครับ/ค่ะ');
        } catch (error) {
            alert('ส่งคำขอไม่สำเร็จ: ' + error.message);
        }
    };

    window.showRequestOptions = (item) => {
        document.getElementById('requestOptionsModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="requestOptionsModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">นัดรับ: ${item.title}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <p class="text-muted">เลือกสิ่งที่ต้องการทำกับรายการนี้</p>
                            <button type="button" class="btn btn-success w-100 py-3 mb-3 request-option-btn" data-request-action="send-request">
                                ส่งคำขอรับของ
                            </button>
                            <button type="button" class="btn btn-outline-primary w-100 py-3 request-option-btn" data-request-action="ask-more">
                                ส่งข้อความสอบถามเพิ่มเติม
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('requestOptionsModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('click', (event) => {
            const button = event.target.closest('.request-option-btn');
            if (!button) return;
            modal.hide();
            if (button.dataset.requestAction === 'send-request') {
                window.submitItemRequest(item.itemId, 'free');
            } else if (typeof window.openChat === 'function') {
                window.openChat(item.ownerId, item.title, item.itemId);
            }
        });
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
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
