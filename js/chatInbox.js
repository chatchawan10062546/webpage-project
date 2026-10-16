// ====================================================
// 📬 chatInbox.js : รายการห้องแชตของผู้ใช้ พร้อมแจ้งเตือนข้อความใหม่
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const chatLink = document.getElementById('chatNavLink');

    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getUser();
        return user?.id || user?.user_id || user?.userId;
    }

    async function requestJson(url) {
        const token = localStorage.getItem('authToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(url, { headers });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    // 🔔 ตรวจสอบจำนวนข้อความที่ยังไม่ได้อ่านรวม เพื่อแสดงตัวเลขบน Navbar
    async function updateChatUnreadBadge() {
        const token = localStorage.getItem('authToken');
        const badge = document.getElementById('chatUnreadBadge');
        if (!token || !badge) return;
        try {
            const data = await requestJson('/api/chat/unread-count');
            if (data.success && data.unread_total > 0) {
                badge.style.display = 'inline-block';
                badge.textContent = data.unread_total;
            } else {
                badge.style.display = 'none';
            }
        } catch (e) {}
    }
    window.updateChatUnreadBadge = updateChatUnreadBadge;

    async function showInbox() {
        const userId = getUserId();
        if (!userId) {
            alert('กรุณาเข้าสู่ระบบก่อนดูข้อความ');
            return;
        }

        try {
            const data = await requestJson(`/api/chat/rooms?user_id=${encodeURIComponent(userId)}`);
            const rooms = data.rooms.map(room => {
                const unreadCount = Number(room.unread_count) || 0;
                return `
                <button type="button" class="list-group-item list-group-item-action chat-room-btn ${unreadCount > 0 ? 'bg-light' : ''}" data-room-id="${room.room_id}" data-item-id="${room.item_id || ''}" data-item-title="${escapeHtml(room.item_title)}" data-other-user-id="${room.other_user_id}">
                    <div class="chat-room-content">
                        <img class="chat-item-thumb" src="${escapeHtml(room.item_image || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80')}" alt="">
                        <div class="chat-room-details">
                            <div class="d-flex justify-content-between gap-2 align-items-center">
                                <strong class="chat-item-title">${escapeHtml(room.item_title)}</strong>
                                <div class="d-flex align-items-center gap-1">
                                    ${unreadCount > 0 ? `<span class="badge bg-danger rounded-pill" style="font-size: 0.72rem;">${unreadCount} ข้อความใหม่</span>` : ''}
                                    <small class="text-muted">${room.latest_created_at ? new Date(room.latest_created_at).toLocaleDateString('th-TH') : ''}</small>
                                </div>
                            </div>
                            <div class="small text-muted">คุยกับ ${escapeHtml(room.other_user_name)}</div>
                            <div class="text-truncate chat-latest-message ${unreadCount > 0 ? 'fw-bold text-dark' : ''}">${escapeHtml(room.latest_message || 'ยังไม่มีข้อความ')}</div>
                        </div>
                    </div>
                </button>
            `;
            }).join('') || '<div class="text-muted text-center py-4">ยังไม่มีห้องแชต</div>';

            document.getElementById('chatInboxModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="chatInboxModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg chat-inbox-dialog">
                        <div class="modal-content chat-inbox-modal rounded-4 border-0 shadow">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title fw-bold"><i class="bi bi-chat-dots me-2"></i>แชตข้อความของฉัน</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-0"><div class="list-group list-group-flush">${rooms}</div></div>
                        </div>
                    </div>
                </div>
            `);

            const modalElement = document.getElementById('chatInboxModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            modalElement.addEventListener('hidden.bs.modal', () => {
                modalElement.remove();
                updateChatUnreadBadge();
            }, { once: true });
            modalElement.addEventListener('click', event => {
                const roomButton = event.target.closest('.chat-room-btn');
                if (!roomButton) return;
                modal.hide();
                window.openChat(roomButton.dataset.otherUserId, roomButton.dataset.itemTitle, roomButton.dataset.itemId, roomButton.dataset.roomId);
            });
        } catch (error) {
            alert('ดึงห้องแชตไม่สำเร็จ: ' + error.message);
        }
    }

    if (chatLink) {
        chatLink.addEventListener('click', event => {
            event.preventDefault();
            showInbox();
        });
    }

    // เริ่มต้นตรวจจำนวนข้อความใหม่
    updateChatUnreadBadge();
    setInterval(updateChatUnreadBadge, 15000);
});
