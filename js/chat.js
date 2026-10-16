// ====================================================
// 💬 chat.js : เปิดห้องแชตและส่งข้อความระหว่างผู้ใช้
// ====================================================

(() => {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

        async function requestJson(url, options = {}) {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const headers = new Headers(options.headers || {});
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    function renderMessages(container, messages, replyEnabled = false) {
        container.innerHTML = messages.map(message => `
            <div class="mb-2 ${String(message.user_id) === String(getUser()?.id || getUser()?.user_id) ? 'text-end' : ''}">
                <div class="small text-muted">${message.user_name} ${message.message_type === 'request' ? '(คำขอรับของ)' : ''}</div>
                <div class="d-inline-block bg-light border rounded px-3 py-2">
                    ${message.message.startsWith("[IMAGE]") ? "<img src=\"" + message.message.replace("[IMAGE]", "") + "\" class=\"img-fluid rounded\" style=\"max-height: 200px; cursor: pointer;\" onclick=\"window.open(this.src, '_blank')\">" : message.message}
                </div>
                ${replyEnabled && String(message.user_id) !== String(getUser()?.id || getUser()?.user_id) ? `
                    <button type="button" class="btn btn-sm btn-outline-success ms-2 message-reply-btn" data-user-id="${message.user_id}">ตอบกลับ</button>
                ` : ''}
            </div>
        `).join('') || '<p class="text-muted">ยังไม่มีข้อความ</p>';
        container.scrollTop = container.scrollHeight;
    }

    window.openItemMessages = async (itemId, itemTitle) => {
        const user = getUser();
        const userId = user?.id || user?.user_id || user?.userId;
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนดูข้อความ');

        try {
            const data = await requestJson(`/api/chat/items/${itemId}/messages?user_id=${userId}`);
            document.getElementById('itemMessagesModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="itemMessagesModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">ข้อความของ: ${itemTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="itemMessagesList" class="border rounded p-3" style="max-height: 360px; overflow-y: auto;"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
            const modalElement = document.getElementById('itemMessagesModal');
            const modal = new bootstrap.Modal(modalElement);
            renderMessages(document.getElementById('itemMessagesList'), data.messages, true);
            modal.show();
            modalElement.addEventListener('click', event => {
                const replyButton = event.target.closest('.message-reply-btn');
                if (!replyButton) return;
                modal.hide();
                window.openChat(replyButton.dataset.userId, itemTitle, itemId);
            });
            modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
        } catch (error) {
            alert('ดึงข้อความไม่สำเร็จ: ' + error.message);
        }
    };

    window.openChat = async (otherUserId, itemTitle, itemId, existingRoomId) => {
        const user = getUser();
        const userId = user?.id || user?.user_id || user?.userId;
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนเปิดแชต');
        if (!otherUserId || String(userId) === String(otherUserId)) return alert('ไม่สามารถเปิดแชตกับตัวเองได้');

        try {
            let roomId = existingRoomId;
            if (!roomId) {
                const room = await requestJson('/api/chat/rooms', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, other_user_id: otherUserId, item_id: itemId || null, name: itemTitle ? `รายการ: ${itemTitle}` : 'แชตสนทนา' })
                });
                roomId = room.room_id;
            }

            document.getElementById('chatModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="chatModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">แชต: ${itemTitle}</h5>
                                <div>
                                    <button type="button" class="btn btn-outline-danger btn-sm me-2 report-chat-btn" data-other-user-id="${otherUserId}" data-item-id="${itemId}" data-title="${itemTitle}">🚨 รายงาน</button>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div id="chatMessages" class="border rounded p-3 mb-3 bg-white" style="height: 450px; overflow-y: auto; scroll-behavior: smooth;"></div>
                                <form id="chatMessageForm" class="d-flex gap-2 align-items-center">
                                    <input type="file" id="chatImageUpload" accept="image/jpeg, image/png" class="d-none">
                                    <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById('chatImageUpload').click()"><i class="bi bi-image"></i></button>
                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ... (หรือแนบสลิป/รูปภาพ)">
                                    <button class="btn btn-success" type="submit">ส่ง</button>
                                </form>
                                <div id="chatImagePreview" class="d-none mt-2">
                                    <span class="badge bg-info text-dark">📷 เลือกรูปภาพแล้ว (กดส่งเพื่ออัปโหลด)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const modalElement = document.getElementById('chatModal');
            const modal = new bootstrap.Modal(modalElement);
            const messagesElement = document.getElementById('chatMessages');
            const loadMessages = () => requestJson(`/api/chat/rooms/${roomId}/messages?user_id=${userId}`)
                .then(data => renderMessages(messagesElement, data.messages))
                .catch(error => { messagesElement.innerHTML = `<p class="text-danger">${error.message}</p>`; });

            modal.show();
            loadMessages();
            const refreshTimer = setInterval(loadMessages, 2000);
            modalElement.addEventListener('hidden.bs.modal', () => {
                clearInterval(refreshTimer);
                modalElement.remove();
                if (typeof window.updateChatUnreadBadge === "function") window.updateChatUnreadBadge();
            }, { once: true });
            
            // Show preview indicator when file is selected
            document.body.addEventListener('change', function(e) {
                if(e.target && e.target.id === 'chatImageUpload') {
                    const preview = document.getElementById('chatImagePreview');
                    if (e.target.files.length > 0) preview.classList.remove('d-none');
                    else preview.classList.add('d-none');
                }
            });

            document.getElementById('chatMessageForm').addEventListener('submit', async event => {
                event.preventDefault();
                const input = document.getElementById('chatMessageInput');
                const fileInput = document.getElementById('chatImageUpload');
                
                if (!input.value.trim() && (!fileInput || fileInput.files.length === 0)) {
                    return alert('กรุณาพิมพ์ข้อความ หรือแนบรูปภาพ');
                }
                
                const formData = new FormData();
                formData.append('user_id', userId);
                formData.append('user_name', user.name);
                formData.append('message', input.value.trim() || ' ');
                if (fileInput && fileInput.files.length > 0) {
                    formData.append('image', fileInput.files[0]);
                }

                try {
                    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                    const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
                        method: 'POST',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                        body: formData
                    });
                    const data = await response.json();
                    if (!data.success) throw new Error(data.message);
                    
                    input.value = '';
                    if (fileInput) {
                        fileInput.value = '';
                        document.getElementById('chatImagePreview').classList.add('d-none');
                    }
                    loadMessages();
                } catch (error) {
                    alert('ส่งข้อความไม่สำเร็จ: ' + error.message);
                }
            });

        } catch (error) {
            alert('เปิดแชตไม่สำเร็จ: ' + error.message);
        }
    };

    document.addEventListener('click', event => {
        const button = event.target.closest('.item-messages-btn');
        const card = event.target.closest('.item-element');
        if (!button || !card) return;
        window.openItemMessages(card.dataset.itemId, card.dataset.title || card.querySelector('.card-title')?.innerText || 'รายการ');
    });
})();

document.addEventListener('click', (e) => {
    const reportChatBtn = e.target.closest('.report-chat-btn');
    if (reportChatBtn && window.openReportModal) {
        const itemId = reportChatBtn.dataset.itemId !== 'null' ? reportChatBtn.dataset.itemId : null;
        const otherUserId = reportChatBtn.dataset.otherUserId;
        const title = reportChatBtn.dataset.title;
        const chatModal = bootstrap.Modal.getInstance(document.getElementById('chatModal'));
        if (chatModal) chatModal.hide();
        window.openReportModal(itemId, otherUserId, `ผู้ใช้จากแชต: ${title}`);
    }
});
