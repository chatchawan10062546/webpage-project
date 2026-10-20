// ====================================================
// ⚡ js/realtimeClient.js : ตัวจัดการ Real-Time ฝั่ง Frontend (Socket.io)
// ====================================================

(() => {
    // 1. ตรวจสอบว่ามี socket.io โหลดเข้ามาหรือไม่
    if (typeof io === 'undefined') {
        console.warn('⚠️ Socket.io library not loaded.');
        return;
    }

    const socket = io();
    window.appSocket = socket;
    window.activeChatRoomId = null;

    // 2. ฟังก์ชันส่งรหัสผู้ใช้เข้าห้องส่วนตัวสำหรับรับการแจ้งเตือน
    function syncUserSocket() {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = user?.id || user?.user_id || user?.userId;
        if (userId && socket.connected) {
            socket.emit('join_user', userId);
        }
    }

    socket.on('connect', () => {
        console.log('⚡ Connected to Real-Time Server! Socket ID:', socket.id);
        syncUserSocket();
    });

    // 3. เสียงแจ้งเตือนด้วย Web Audio API (ไม่ต้องพึ่งพาไฟล์เสียงภายนอก โหลดไว ไม่หน่วง)
    function playChime(type = 'notification') {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'chat') {
                // เสียงป๊อปคู่สำหรับแชต
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.28);
            } else {
                // เสียงระฆังนุ่มนวลสำหรับการแจ้งเตือนทั่วไป
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.09); // E5
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.18); // G5
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.45);
            }
        } catch (e) {
            // silent fail on audio policy restrictions
        }
    }
    window.playRealtimeChime = playChime;

    // 4. แสดง Toast Popup ลอยมุมขวาบนของหน้าจอ
    function showRealtimeToast({ title, message, icon = 'bi-bell-fill', bg = 'bg-primary', onClick = null }) {
        let container = document.getElementById('realtimeToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'realtimeToastContainer';
            container.className = 'toast-container position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }

        const toastId = 'toast_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bg} border-0 shadow-lg rounded-4 mb-2 animate__animated animate__fadeInRight" role="alert" aria-live="assertive" aria-atomic="true" style="cursor: pointer; min-width: 280px; max-width: 380px;">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-start gap-3 p-3 w-100">
                        <div class="fs-4 mt-1"><i class="bi ${icon}"></i></div>
                        <div class="flex-grow-1">
                            <div class="fw-bold" style="font-size: 0.95rem;">${title}</div>
                            <div class="small opacity-90 text-wrap mt-1" style="font-size: 0.85rem; line-height: 1.35;">${message}</div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const bsToast = new bootstrap.Toast(toastEl, { delay: 6000 });

        if (typeof onClick === 'function') {
            toastEl.addEventListener('click', (e) => {
                if (e.target.closest('.btn-close')) return;
                onClick();
                bsToast.hide();
            });
        }

        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        bsToast.show();
    }
    window.showRealtimeToast = showRealtimeToast;

    // 5. รับ Event: การแจ้งเตือนใหม่ (new_notification)
    socket.on('new_notification', (data) => {
        playChime('notification');

        // อัปเดตตัวเลขกระดิ่งทันที
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            const current = parseInt(notifBadge.innerText) || 0;
            notifBadge.innerText = current + 1;
            notifBadge.style.display = 'inline-block';
        }

        // ดึงรายการแจ้งเตือนใหม่มาใส่ใน Dropdown ทันทีถ้าฟังก์ชันเปิดอยู่
        if (typeof window.fetchNotifications === 'function') {
            window.fetchNotifications();
        }

        // ถ้าเกี่ยวกับการซื้อขาย ให้รีเฟรช Badge ธุรกรรมด้วย
        if (typeof window.updateTransactionsBadge === 'function') {
            window.updateTransactionsBadge();
        }
        if (typeof window.updateAllNavBadges === 'function') {
            window.updateAllNavBadges();
        }

        // แสดง Toast Popup
        showRealtimeToast({
            title: '🔔 การแจ้งเตือนใหม่',
            message: data.message,
            icon: 'bi-bell-fill',
            bg: 'bg-success',
            onClick: () => {
                if (data.type === 'transaction_update' || data.type === 'damage_claimed') {
                    if (typeof window.openMyTransactionsModal === 'function') window.openMyTransactionsModal();
                } else if (data.type === 'request_received') {
                    const mySalesModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('mySalesModal'));
                    if (mySalesModal) {
                        if (typeof window.loadMySales === 'function') window.loadMySales();
                        mySalesModal.show();
                    }
                }
            }
        });
    });

    // 6. รับ Event: ข้อความแชตใหม่ (chat_notification) สำหรับคนรับที่ไม่ได้เปิดห้องนั้นอยู่
    socket.on('chat_notification', (data) => {
        // หากผู้ใช้กำลังเปิดคุยในห้องนี้อยู่แล้ว ไม่ต้องเด้ง Toast (ข้อความจะขึ้นในกล่องแชตตรงๆ อยู่แล้ว)
        if (window.activeChatRoomId && String(window.activeChatRoomId) === String(data.room_id)) {
            return;
        }

        playChime('chat');

        if (typeof window.updateAllNavBadges === 'function') {
            window.updateAllNavBadges();
        }
        // อัปเดตตัวเลขแชตที่ยังไม่ได้อ่านบน Navbar ทันที
        const chatBadge = document.getElementById('chatUnreadBadge');
        if (chatBadge) {
            const current = parseInt(chatBadge.textContent) || 0;
            chatBadge.textContent = current + 1;
            chatBadge.style.display = 'inline-block';
        }

        let msgText = data.message || '';
        if (msgText.startsWith('[IMAGE]')) {
            msgText = '📷 [ส่งรูปภาพ]';
        } else if (msgText.startsWith('[IMAGES]')) {
            const payload = msgText.slice(8);
            if (payload.startsWith('{')) {
                try {
                    const parsed = JSON.parse(payload);
                    msgText = parsed.text ? `📷 [รูปภาพ] ${parsed.text}` : `📷 [ส่งรูปภาพ ${parsed.images?.length || ''} รูป]`;
                } catch(e) {
                    msgText = '📷 [ส่งรูปภาพหลายรูป]';
                }
            } else {
                const count = payload.split(',').length;
                msgText = `📷 [ส่งรูปภาพ ${count} รูป]`;
            }
        }
        showRealtimeToast({
            title: `💬 ข้อความใหม่จาก ${data.user_name}`,
            message: msgText,
            icon: 'bi-chat-dots-fill',
            bg: 'bg-primary',
            onClick: () => {
                if (typeof window.openChat === 'function') {
                    window.openChat(data.user_id, data.user_name, null, data.room_id);
                }
            }
        });
    });


    // 7. รับ Event: มีคำขอรับของใหม่เข้ามาหาคนขาย (request_received)
    socket.on('request_received', (data) => {
        playChime('notification');

        // อัปเดตตัวเลขคำขอบนการ์ดสินค้าบนหน้าเว็บแบบ Real-Time ทันทีโดยไม่ต้องรีเฟรชหน้า!
        if (data.itemId) {
            const card = document.querySelector(`.item-element[data-item-id="${data.itemId}"]`);
            if (card) {
                const reqBtn = card.querySelector('.item-requests-btn');
                if (reqBtn) {
                    let badge = reqBtn.querySelector('.badge');
                    const count = data.pendingCount || ((parseInt(badge?.textContent) || 0) + 1);
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'badge rounded-pill bg-danger ms-1 animate__animated animate__heartBeat';
                        badge.style.fontSize = '0.65rem';
                        reqBtn.appendChild(badge);
                    } else {
                        badge.classList.remove('animate__heartBeat');
                        void badge.offsetWidth;
                        badge.classList.add('animate__heartBeat');
                    }
                    badge.textContent = count;
                }
            }
        }

        // อัปเดตตัวเลข Badge บน Navbar ทั้งหมด
        if (typeof window.updateAllNavBadges === 'function') {
            window.updateAllNavBadges();
        }

        // แจ้งเตือน Toast Popup
        showRealtimeToast({
            title: '📋 มีคำขอรับของใหม่!',
            message: `${data.requesterName || 'มีผู้ใช้งาน'} ได้ส่งคำขอรับ "${data.itemTitle || ''}" ของคุณ`,
            icon: 'bi-box-seam',
            bg: 'bg-success',
            onClick: () => {
                if (typeof window.openMySalesModal === 'function') {
                    window.openMySalesModal('seller');
                }
            }
        });
    });

    // 8. รับ Event: สถานะคำขอของคนซื้อได้รับการอัปเดต (ยอมรับ/ปฏิเสธ) (request_status_updated)
    socket.on('request_status_updated', (data) => {
        playChime('notification');

        // อัปเดตตัวเลข Badge บน Navbar ทั้งหมด
        if (typeof window.updateAllNavBadges === 'function') {
            window.updateAllNavBadges();
        }

        const isAccepted = data.status === 'accepted';
        showRealtimeToast({
            title: isAccepted ? '🎉 คำขอของคุณได้รับการอนุมัติแล้ว!' : '❌ คำขอรับของถูกปฏิเสธ',
            message: `รายการ "${data.itemTitle || ''}" ${isAccepted ? 'ผู้ขายตอบรับคำขอแล้ว เตรียมนัดรับของได้เลย!' : 'ผู้ขายปฏิเสธคำขอ'}`,
            icon: isAccepted ? 'bi-check-circle-fill' : 'bi-x-circle-fill',
            bg: isAccepted ? 'bg-success' : 'bg-secondary',
            onClick: () => {
                if (typeof window.openMyRequestsModal === 'function') {
                    window.openMyRequestsModal();
                }
            }
        });
    });

    // ตรวจสอบเมื่อมีการเปลี่ยนสถานะล็อกอิน
    window.addEventListener('storage', (e) => {
        if (e.key === 'user' || e.key === 'authToken') {
            syncUserSocket();
        }
    });

    document.addEventListener('DOMContentLoaded', syncUserSocket);
})();

