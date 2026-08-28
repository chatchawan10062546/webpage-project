// ====================================================
// 💬 chat.js : เปิดห้องแชตและส่งข้อความระหว่างผู้ใช้
// ====================================================

(() => {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    function renderMessages(container, messages, replyEnabled = false) {
        container.innerHTML = messages.map(message => `
            <div class="mb-2 ${String(message.user_id) === String(getUser()?.id || getUser()?.user_id) ? 'text-end' : ''}">
                <div class="small text-muted">${message.user_name} ${message.message_type === 'request' ? '(คำขอรับของ)' : ''}</div>
                <div class="d-inline-block bg-light border rounded px-3 py-2">${message.message}</div>
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
            const data = await requestJson(`http://localhost:3000/api/chat/items/${itemId}/messages?user_id=${userId}`);
            document.getElementById('itemMessagesModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="itemMessagesModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
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

    window.openChat = async (otherUserId, itemTitle, itemId) => {
        const user = getUser();
        const userId = user?.id || user?.user_id || user?.userId;
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนเปิดแชต');
        if (!otherUserId || String(userId) === String(otherUserId)) return alert('ไม่สามารถเปิดแชตกับตัวเองได้');

        try {
            const room = await requestJson('http://localhost:3000/api/chat/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, other_user_id: otherUserId, item_id: itemId, name: `รายการ: ${itemTitle}` })
            });

            document.getElementById('chatModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="chatModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">แชต: ${itemTitle}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="chatMessages" class="border rounded p-3 mb-3" style="height: 280px; overflow-y: auto;"></div>
                                <form id="chatMessageForm" class="d-flex gap-2">
                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ..." required>
                                    <button class="btn btn-success" type="submit">ส่ง</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            const modalElement = document.getElementById('chatModal');
            const modal = new bootstrap.Modal(modalElement);
            const messagesElement = document.getElementById('chatMessages');
            const loadMessages = () => requestJson(`http://localhost:3000/api/chat/rooms/${room.room_id}/messages?user_id=${userId}`)
                .then(data => renderMessages(messagesElement, data.messages))
                .catch(error => { messagesElement.innerHTML = `<p class="text-danger">${error.message}</p>`; });

            modal.show();
            loadMessages();
            const refreshTimer = setInterval(loadMessages, 2000);
            modalElement.addEventListener('hidden.bs.modal', () => {
                clearInterval(refreshTimer);
                modalElement.remove();
            }, { once: true });
            document.getElementById('chatMessageForm').addEventListener('submit', event => {
                event.preventDefault();
                const input = document.getElementById('chatMessageInput');
                requestJson(`http://localhost:3000/api/chat/rooms/${room.room_id}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId, user_name: user.name, message: input.value })
                }).then(() => { input.value = ''; loadMessages(); })
                    .catch(error => alert('ส่งข้อความไม่สำเร็จ: ' + error.message));
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
