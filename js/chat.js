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

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderChatMessageContent(msgText) {
        if (!msgText) return '';

        let textPart = '';
        let images = [];

        if (msgText.startsWith('[IMAGES]')) {
            const payload = msgText.slice(8);
            if (payload.startsWith('{')) {
                try {
                    const parsed = JSON.parse(payload);
                    textPart = parsed.text || '';
                    images = Array.isArray(parsed.images) ? parsed.images : [];
                } catch (e) {
                    images = payload.split(',').map(s => s.trim()).filter(Boolean);
                }
            } else {
                images = payload.split(',').map(s => s.trim()).filter(Boolean);
            }
        } else if (msgText.startsWith('[IMAGE]')) {
            images = [msgText.slice(7).trim()];
        } else {
            textPart = msgText;
        }

        let parts = [];
        if (textPart) {
            parts.push(`<div>${escapeHtml(textPart)}</div>`);
        }

        if (images.length === 1) {
            parts.push(`
                <div class="${textPart ? 'mt-2' : ''}">
                    <img src="${escapeHtml(images[0])}" class="img-fluid rounded border shadow-sm" style="max-height: 240px; max-width: 100%; cursor: pointer; object-fit: contain; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" onclick="window.open(this.src, '_blank')" alt="รูปภาพแชต" title="คลิกเพื่อดูรูปขนาดเต็ม">
                </div>
            `);
        } else if (images.length > 1) {
            const isTwoOrFour = images.length === 2 || images.length === 4;
            const itemWidth = isTwoOrFour ? 'width: calc(50% - 4px);' : 'width: calc(33.333% - 4px);';
            const imgHeight = isTwoOrFour ? 'height: 120px;' : 'height: 95px;';
            const imgsHtml = images.map((imgUrl, i) => `
                <div style="${itemWidth}">
                    <img src="${escapeHtml(imgUrl)}" class="rounded border shadow-sm w-100" style="${imgHeight} object-fit: cover; cursor: pointer; transition: transform 0.15s ease, opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'" onclick="window.open(this.src, '_blank')" alt="รูปภาพแชตที่ ${i + 1}" title="คลิกเพื่อดูรูปขนาดเต็ม">
                </div>
            `).join('');

            parts.push(`
                <div class="d-flex flex-wrap gap-1 ${textPart ? 'mt-2' : ''}" style="max-width: 300px; width: 100%;">
                    ${imgsHtml}
                </div>
            `);
        }

        return parts.join('');
    }

    function renderMessages(container, messages, replyEnabled = false) {
        container.innerHTML = messages.map(message => {
            const isMe = String(message.user_id) === String(getUser()?.id || getUser()?.user_id);
            const isRequestCard = message.message && (message.message.includes('ส่งคำขอนัดรับ:') || message.message.includes('📅 ขอเช่าวันที่:'));
            const bubbleBg = isMe ? (isRequestCard ? 'bg-success bg-opacity-10 border border-success' : 'bg-light border') : (isRequestCard ? 'bg-warning bg-opacity-10 border border-warning' : 'bg-light border');
            return `
            <div class="mb-2 ${isMe ? 'text-end' : ''}" data-msg-id="${message.id || ''}">
                <div class="small text-muted mb-1">${escapeHtml(message.user_name)} ${message.message_type === 'request' ? '(คำขอรับของ)' : ''}</div>
                <div class="d-inline-block ${bubbleBg} rounded-3 px-3 py-2 text-dark shadow-sm" style="white-space: pre-line; text-align: start; line-height: 1.5; max-width: 85%; font-size: 0.92rem;">
                    ${renderChatMessageContent(message.message)}
                </div>
                ${replyEnabled && !isMe ? `
                    <button type="button" class="btn btn-sm btn-outline-success ms-2 message-reply-btn" data-user-id="${message.user_id}">ตอบกลับ</button>
                ` : ''}
            </div>
            `;
        }).join('') || '<p class="text-muted">ยังไม่มีข้อความ</p>';
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

    window.openChat = async (otherUserId, itemTitle, itemId, existingRoomId, initialMessage = "") => {
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
                            <div class="modal-header d-flex justify-content-between align-items-center gap-2 py-2 px-3 border-bottom bg-light">
                                <div class="d-flex align-items-center gap-2 min-width-0 flex-grow-1 overflow-hidden">
                                    <i class="bi bi-chat-dots-fill text-success fs-5 flex-shrink-0"></i>
                                    <div class="min-width-0 flex-grow-1">
                                        <h6 class="modal-title fw-bold text-dark mb-0 text-truncate" title="แชต: ${itemTitle}">
                                            ${itemTitle ? `แชต: ${itemTitle}` : 'แชตสนทนา'}
                                        </h6>
                                    </div>
                                </div>
                                <div class="d-flex align-items-center gap-2 flex-shrink-0">
                                    <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-2 py-1 d-inline-flex align-items-center gap-1 report-chat-btn shadow-none" 
                                            data-other-user-id="${otherUserId}" data-item-id="${itemId}" data-title="${itemTitle}"
                                            style="font-size: 0.8rem; font-weight: 600; white-space: nowrap;" title="รายงานปัญหาผู้ใช้หรือแชตนี้">
                                        <i class="bi bi-shield-exclamation text-danger"></i>
                                        <span>รายงาน</span>
                                    </button>
                                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div id="chatMessages" class="border rounded p-3 mb-2 bg-white" style="height: 420px; overflow-y: auto; scroll-behavior: smooth;"></div>
                                
                                <div id="chatImagePreview" class="d-none mb-2 p-2 bg-light border rounded">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <span class="small fw-bold text-muted" id="chatImageCountText">📷 รูปภาพที่เลือก (0 รูป)</span>
                                        <button type="button" class="btn btn-sm btn-link text-danger p-0 text-decoration-none" id="chatClearImagesBtn" style="font-size: 0.78rem;">
                                            <i class="bi bi-trash3 me-1"></i>ล้างทั้งหมด
                                        </button>
                                    </div>
                                    <div id="chatImageThumbs" class="d-flex flex-wrap gap-2 pt-1"></div>
                                </div>

                                <form id="chatMessageForm" class="d-flex gap-2 align-items-center">
                                    <input type="file" id="chatImageUpload" accept="image/jpeg, image/png, image/webp" class="d-none" multiple>
                                    <button type="button" class="btn btn-outline-secondary position-relative px-3" id="chatUploadBtn" onclick="document.getElementById('chatImageUpload').click()" title="แนบรูปภาพ (เลือกได้หลายรูป)">
                                        <i class="bi bi-images fs-6"></i>
                                        <span id="chatSelectedBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success d-none" style="font-size: 0.65rem;">0</span>
                                    </button>
                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ... (หรือแนบรูปภาพ)">
                                    <button class="btn btn-success px-3 fw-bold" type="submit" id="chatSubmitBtn">ส่ง</button>
                                </form>
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
            if (initialMessage) {
                const msgInput = document.getElementById("chatMessageInput");
                if (msgInput) { msgInput.value = initialMessage; msgInput.focus(); }
            }

            // ⚡ จัดการการเลือกรูปภาพหลายรูปและพรีวิว
            let selectedChatFiles = [];
            const fileInput = document.getElementById('chatImageUpload');
            const previewContainer = document.getElementById('chatImagePreview');
            const thumbsContainer = document.getElementById('chatImageThumbs');
            const countText = document.getElementById('chatImageCountText');
            const clearBtn = document.getElementById('chatClearImagesBtn');
            const badgeEl = document.getElementById('chatSelectedBadge');

            function renderSelectedImagesPreview() {
                if (!previewContainer || !thumbsContainer) return;
                if (selectedChatFiles.length === 0) {
                    previewContainer.classList.add('d-none');
                    if (badgeEl) {
                        badgeEl.classList.add('d-none');
                        badgeEl.textContent = '0';
                    }
                    thumbsContainer.innerHTML = '';
                    return;
                }

                previewContainer.classList.remove('d-none');
                if (badgeEl) {
                    badgeEl.classList.remove('d-none');
                    badgeEl.textContent = selectedChatFiles.length;
                }
                if (countText) {
                    countText.textContent = `📷 รูปภาพที่เลือก (${selectedChatFiles.length} รูป)`;
                }

                thumbsContainer.innerHTML = '';
                selectedChatFiles.forEach((file, index) => {
                    const objectUrl = URL.createObjectURL(file);
                    const thumbDiv = document.createElement('div');
                    thumbDiv.className = 'position-relative d-inline-block';
                    thumbDiv.innerHTML = `
                        <img src="${objectUrl}" class="rounded border shadow-sm" style="width: 52px; height: 52px; object-fit: cover;" alt="Preview ${index + 1}">
                        <button type="button" class="btn btn-danger btn-sm rounded-circle position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center shadow-sm" 
                                data-remove-index="${index}" 
                                style="width: 18px; height: 18px; transform: translate(35%, -35%); font-size: 11px; line-height: 1;" 
                                title="ลบรูปนี้">&times;</button>
                    `;
                    thumbsContainer.appendChild(thumbDiv);
                });
            }

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                        const remainingQuota = 10 - selectedChatFiles.length;
                        if (remainingQuota <= 0) {
                            alert('สามารถแนบรูปภาพได้สูงสุด 10 รูปต่อข้อความ');
                        } else {
                            const toAdd = files.slice(0, remainingQuota);
                            if (files.length > remainingQuota) {
                                alert('แนบได้สูงสุด 10 รูป (เพิ่มเฉพาะ ' + remainingQuota + ' รูปแรก)');
                            }
                            selectedChatFiles = selectedChatFiles.concat(toAdd);
                            renderSelectedImagesPreview();
                        }
                    }
                    fileInput.value = '';
                });
            }

            if (thumbsContainer) {
                thumbsContainer.addEventListener('click', (e) => {
                    const rmBtn = e.target.closest('[data-remove-index]');
                    if (rmBtn) {
                        const idx = parseInt(rmBtn.getAttribute('data-remove-index'), 10);
                        if (!isNaN(idx)) {
                            selectedChatFiles.splice(idx, 1);
                            renderSelectedImagesPreview();
                        }
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    selectedChatFiles = [];
                    renderSelectedImagesPreview();
                });
            }

            // ⚡ เข้าร่วมห้อง WebSocket สำหรับรับข้อความสดทันที
            window.activeChatRoomId = roomId;
            if (window.appSocket) {
                window.appSocket.emit('join_room', roomId);

                const handleLiveMessage = (newMsg) => {
                    if (String(newMsg.room_id) === String(roomId)) {
                        if (newMsg.id && messagesElement.querySelector(`[data-msg-id="${newMsg.id}"]`)) {
                            return;
                        }
                        const isMe = String(newMsg.user_id) === String(userId);
                        const isRequestCard = newMsg.message && (newMsg.message.includes('ส่งคำขอนัดรับ:') || newMsg.message.includes('📅 ขอเช่าวันที่:'));
                        const bubbleBg = isMe ? (isRequestCard ? 'bg-success bg-opacity-10 border border-success' : 'bg-light border') : (isRequestCard ? 'bg-warning bg-opacity-10 border border-warning' : 'bg-light border');
                        const msgHtml = `
                            <div class="mb-2 ${isMe ? 'text-end' : ''}" data-msg-id="${newMsg.id || ''}">
                                <div class="small text-muted mb-1">${escapeHtml(newMsg.user_name)}</div>
                                <div class="d-inline-block ${bubbleBg} rounded-3 px-3 py-2 text-dark shadow-sm" style="white-space: pre-line; text-align: start; line-height: 1.5; max-width: 85%; font-size: 0.92rem;">
                                    ${renderChatMessageContent(newMsg.message)}
                                </div>
                            </div>
                        `;
                        if (messagesElement.innerHTML.includes('ยังไม่มีข้อความ')) {
                            messagesElement.innerHTML = '';
                        }
                        messagesElement.insertAdjacentHTML('beforeend', msgHtml);
                        messagesElement.scrollTop = messagesElement.scrollHeight;

                        if (!isMe && typeof window.playRealtimeChime === 'function') {
                            window.playRealtimeChime('chat');
                        }
                    }
                };

                window.appSocket.on('new_chat_message', handleLiveMessage);

                modalElement.addEventListener('hidden.bs.modal', () => {
                    window.appSocket.off('new_chat_message', handleLiveMessage);
                    window.appSocket.emit('leave_room', roomId);
                    window.activeChatRoomId = null;
                }, { once: true });
            }

            // สำรอง Polling ไว้ทุก 10 วิ
            const refreshTimer = setInterval(loadMessages, 10000);
            modalElement.addEventListener('hidden.bs.modal', () => {
                clearInterval(refreshTimer);
                modalElement.remove();
                if (typeof window.updateChatUnreadBadge === "function") window.updateChatUnreadBadge();
            }, { once: true });

            document.getElementById('chatMessageForm').addEventListener('submit', async event => {
                event.preventDefault();
                const input = document.getElementById('chatMessageInput');
                const submitBtn = document.getElementById('chatSubmitBtn');
                const textVal = input.value.trim();
                
                if (!textVal && selectedChatFiles.length === 0) {
                    return alert('กรุณาพิมพ์ข้อความ หรือแนบรูปภาพ');
                }
                
                const formData = new FormData();
                formData.append('user_id', userId);
                formData.append('user_name', user.name);
                formData.append('message', textVal);
                selectedChatFiles.forEach(f => {
                    formData.append('images', f);
                });

                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
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
                    selectedChatFiles = [];
                    renderSelectedImagesPreview();
                    loadMessages();
                } catch (error) {
                    alert('ส่งข้อความไม่สำเร็จ: ' + error.message);
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = 'ส่ง';
                    }
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
