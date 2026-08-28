// ====================================================
// 📬 chatInbox.js : รายการห้องแชตของผู้ใช้
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const chatLink = document.getElementById('chatNavLink');
    if (!chatLink) return;

    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getUser();
        return user?.id || user?.user_id || user?.userId;
    }

    async function requestJson(url) {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    async function showInbox() {
        const userId = getUserId();
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบก่อนดูข้อความ');
            return;
        }

        try {
            const data = await requestJson(`http://localhost:3000/api/chat/rooms?user_id=${encodeURIComponent(userId)}`);
            const rooms = data.rooms.map(room => `
                <button type="button" class="list-group-item list-group-item-action chat-room-btn" data-room-id="${room.room_id}" data-item-id="${room.item_id || ''}" data-item-title="${escapeHtml(room.item_title)}" data-other-user-id="${room.other_user_id}">
                    <div class="chat-room-content">
                        <img class="chat-item-thumb" src="${escapeHtml(room.item_image || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80')}" alt="">
                        <div class="chat-room-details">
                            <div class="d-flex justify-content-between gap-2">
                                <strong class="chat-item-title">${escapeHtml(room.item_title)}</strong>
                                <small class="text-muted">${room.latest_created_at ? new Date(room.latest_created_at).toLocaleDateString('th-TH') : ''}</small>
                            </div>
                            <div class="small text-muted">คุยกับ ${escapeHtml(room.other_user_name)}</div>
                            <div class="text-truncate chat-latest-message">${escapeHtml(room.latest_message || 'ยังไม่มีข้อความ')}</div>
                        </div>
                    </div>
                </button>
            `).join('') || '<div class="text-muted text-center py-4">ยังไม่มีห้องแชต</div>';

            document.getElementById('chatInboxModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="chatInboxModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg chat-inbox-dialog">
                        <div class="modal-content chat-inbox-modal">
                            <div class="modal-header">
                                <h5 class="modal-title">แชตข้อความของฉัน</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-0"><div class="list-group list-group-flush">${rooms}</div></div>
                        </div>
                    </div>
                </div>
            `);

            const modalElement = document.getElementById('chatInboxModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
            modalElement.addEventListener('click', event => {
                const roomButton = event.target.closest('.chat-room-btn');
                if (!roomButton) return;
                modal.hide();
                window.openChat(roomButton.dataset.otherUserId, roomButton.dataset.itemTitle, roomButton.dataset.itemId);
            });
        } catch (error) {
            alert('ดึงห้องแชตไม่สำเร็จ: ' + error.message);
        }
    }

    chatLink.addEventListener('click', event => {
        event.preventDefault();
        showInbox();
    });
});
