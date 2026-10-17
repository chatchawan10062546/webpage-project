// ====================================================
// 💳 transactions.js : เริ่มและชำระธุรกรรมคนกลาง (โหมดทดสอบ & ระบบปล่อยเช่า)
// ====================================================

(() => {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
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

    async function updateTransactionsBadge() {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
            const res = await fetch('/api/transactions/me/badge-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success) return;

            const count = data.count || 0;
            const badges = [
                document.getElementById('myTransactionsBadge'),
                document.getElementById('navTransactionsBadge'),
                document.getElementById('userMenuTxBadge')
            ];

            badges.forEach(badge => {
                if (!badge) return;
                if (count > 0) {
                    badge.style.display = 'inline-block';
                    badge.textContent = count;
                    if (data.actionCount > 0) {
                        badge.className = 'badge bg-danger rounded-pill ms-1';
                    } else {
                        badge.className = 'badge bg-warning text-dark rounded-pill ms-1';
                    }
                } else {
                    badge.style.display = 'none';
                }
            });
        } catch (e) {
            // silent fail
        }
    }
    window.updateTransactionsBadge = updateTransactionsBadge;

    function renderPaymentModal(item, transactionId, amount) {
        document.getElementById('paymentModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="paymentModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title"><i class="bi bi-shield-check me-2"></i>ชำระเงินผ่านระบบคนกลาง</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-0">
                            <!-- ภาพแบบ Edge-to-edge -->
                            <div class="position-relative">
                                <img src="${(item.images && item.images[0]) || item.image_url || 'https://via.placeholder.com/600x300'}" class="w-100 object-fit-cover" style="height: 250px;" alt="">
                                <div class="position-absolute bottom-0 start-0 w-100 p-4" style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                                    <h3 class="fw-bold text-white mb-0 text-truncate">${escapeHtml(item.title)}</h3>
                                </div>
                            </div>
                            
                            <div class="p-4">
                                <!-- ราคา -->
                                <div class="d-flex justify-content-between align-items-center mb-4 bg-light rounded-4 p-4 border shadow-sm">
                                    <div>
                                        <span class="text-muted fw-bold fs-5 d-block">ยอดที่ต้องชำระ</span>
                                        ${item.item_type === 'rent' || item.itemType === 'rent' ? '<small class="text-primary">(รวมค่าเช่าตามจำนวนวัน + เงินมัดจำแล้ว)</small>' : ''}
                                    </div>
                                    <span class="text-success fw-bold display-6 mb-0">฿${Number(amount).toLocaleString()}</span>
                                </div>

                                <!-- ขั้นตอน -->
                                <div class="px-2 mb-3 mt-4">
                                    <div class="d-flex justify-content-between position-relative mb-2">
                                        <div class="progress position-absolute top-50 start-0 w-100 translate-middle-y" style="height: 4px; z-index: 1;">
                                            <div class="progress-bar bg-success" style="width: 25%"></div>
                                        </div>
                                        <div class="position-relative bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">1</div>
                                        <div class="position-relative bg-light text-muted border border-2 rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">2</div>
                                        <div class="position-relative bg-light text-muted border border-2 rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">3</div>
                                    </div>
                                    <div class="d-flex justify-content-between text-muted" style="font-size: 0.8rem;">
                                        <span class="fw-bold text-success text-center" style="width: 70px; margin-left: -20px;">โอนเงิน</span>
                                        <span class="text-center" style="width: 70px;">ระบบพักเงิน</span>
                                        <span class="text-center" style="width: 70px; margin-right: -20px;">รับของ & คืนเงิน</span>
                                    </div>
                                </div>

                                <div class="text-center my-4 py-2 bg-light rounded-4 border border-dashed">
                                    <div class="small text-muted mb-2"><i class="bi bi-qr-code me-1"></i>สแกน QR เพื่อชำระเงินเข้าสู่บัญชีระบบคนกลาง</div>
                                    <img src="https://promptpay.io/0812345678/${amount}.png" alt="QR Code" class="img-fluid rounded-3 shadow-sm border p-2 bg-white" style="max-height: 200px;">
                                    <div class="mt-2 text-muted fw-bold" style="font-size: 0.85rem;">ระบบคนกลาง PanSuk Escrow</div>
                                </div>

                                <!-- อัปโหลดสลิป -->
                                <div class="mb-3">
                                    <label class="form-label fw-bold text-dark"><i class="bi bi-receipt me-1"></i>อัปโหลดสลิปการโอนเงิน <span class="text-danger">*</span></label>
                                    <input type="file" id="slipFileInput" class="form-control rounded-3" accept="image/*">
                                </div>

                                <button class="btn btn-primary btn-lg w-100 rounded-pill shadow fw-bold py-3" id="confirmPaymentBtn">
                                    <i class="bi bi-check-circle-fill me-2"></i>ยืนยันการชำระเงิน และอัปโหลดสลิป
                                </button>
                                
                                <div class="text-center mt-3">
                                    <small class="text-muted d-block"><i class="bi bi-shield-lock-fill me-1 text-success"></i>เงินของคุณจะถูกเก็บรักษาอย่างปลอดภัยในระบบคนกลาง</small>
                                    <small class="text-secondary d-block mt-1" style="font-size: 0.75rem;">* กรณีเช่าสินค้า เงินมัดจำจะคืนให้เมื่อส่งของครบสมบูรณ์ หากชำรุดเสียหายและไม่ยินยอมชดใช้ แอดมินมีอำนาจตรวจสอบหลักฐานและโอนชดเชยให้ผู้ให้เช่าได้ทันที</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
        modal.show();

        document.getElementById('confirmPaymentBtn').addEventListener('click', async event => {
            const fileInput = document.getElementById('slipFileInput');
            if (!fileInput.files || fileInput.files.length === 0) {
                return alert('กรุณาเลือกไฟล์สลิปการโอนเงินเพื่อยืนยัน');
            }

            const btn = document.getElementById('confirmPaymentBtn');
            try {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังส่งข้อมูลสลิป...';

                const formData = new FormData();
                formData.append('slip', fileInput.files[0]);

                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const response = await fetch(`/api/transactions/${transactionId}/pay`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'ชำระเงินไม่สำเร็จ');

                alert('✅ แจ้งชำระเงินสำเร็จ! แนบสลิปเรียบร้อยแล้ว เงินจะถูกพักไว้ในระบบคนกลาง');
                setTimeout(() => {
                    modal.hide();
                    if (typeof openMyTransactionsModal === 'function') {
                        openMyTransactionsModal();
                    }
                }, 1000);
            } catch (error) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>ยืนยันการชำระเงิน และอัปโหลดสลิป';
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });
    }

    // เริ่มทำธุรกรรมคนกลาง (รองรับทั้งซื้อขาดและปล่อยเช่า)
    window.startEscrowPurchase = async (item, rentalData = null) => {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนทำรายการ');

        try {
            const payload = { item_id: item.itemId };
            if (rentalData) {
                Object.assign(payload, rentalData);
            }
            const result = await requestJson('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            renderPaymentModal(item, result.transaction_id, result.amount || item.price);
        } catch (error) {
            alert('เริ่มธุรกรรมไม่สำเร็จ: ' + error.message);
        }
    };

    // 📌 เปิดหน้าต่างประวัติการซื้อขาย / เช่าของฉัน
    window.openMyTransactionsModal = async () => {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบ');

        // ทำเครื่องหมายอ่านแจ้งเตือนธุรกรรม และอัปเดต Badge ทันที
        const token = localStorage.getItem('authToken');
        if (token) {
            fetch('/api/notifications/mark-transactions-read', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(() => updateTransactionsBadge()).catch(() => {});
        }

        try {
            const data = await requestJson('/api/transactions/me/all');
            document.getElementById('myTransactionsModal')?.remove();

            const activeCount = data.transactions.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
            const completedCount = data.transactions.filter(t => t.status === 'completed').length;

            function getActionNotice(t) {
                if (t.status === 'completed' || t.status === 'cancelled' || t.status === 'released') return null;
                const isBuyer = String(t.receiver_id) === String(userId);
                const isRental = t.item_type === 'rent';
                const isShipped = t.shipping_status === 'shipped' || t.shipping_status === 'delivered';
                const isRentingOrBeyond = ['renting', 'returning', 'returned', 'damage_claimed'].includes(t.rental_status);

                if (isBuyer) {
                    if (t.status === 'awaiting_payment') return { text: 'รอคุณชำระเงิน', cls: 'bg-danger text-white' };
                    if (isRental && !isRentingOrBeyond && isShipped) return { text: 'รอคุณยืนยันรับของ (เริ่มเช่า)', cls: 'bg-warning text-dark' };
                    if (!isRental && isShipped) return { text: 'รอคุณยืนยันรับสินค้า', cls: 'bg-warning text-dark' };
                    if (isRental && t.rental_status === 'damage_claimed' && t.claim_status === 'pending') return { text: 'รอคุณพิจารณายอดหักมัดจำ', cls: 'bg-danger text-white' };
                } else {
                    if (isRental) {
                        if (!isShipped && !isRentingOrBeyond && (t.rental_status === 'paid' || t.status === 'paid')) return { text: 'รอคุณจัดส่งสินค้า', cls: 'bg-danger text-white' };
                        if (t.rental_status === 'returning') return { text: 'รอคุณตรวจสอบของส่งคืน', cls: 'bg-danger text-white' };
                        if (t.rental_status === 'damage_claimed' && t.claim_status === 'pending') return { text: 'รอการเจรจา/ตัดสิน', cls: 'bg-warning text-dark' };
                    } else {
                        if (t.status === 'paid' && !isShipped) return { text: 'รอคุณจัดส่งสินค้า', cls: 'bg-danger text-white' };
                    }
                }
                return null;
            }

            let trs = data.transactions.map(t => {
                const isBuyer = String(t.receiver_id) === String(userId);
                const isRental = t.item_type === 'rent';
                const actionNotice = getActionNotice(t);
                const txGroup = (t.status === 'completed') ? 'completed' : (t.status === 'cancelled') ? 'cancelled' : 'active';
                
                const roleText = isBuyer 
                    ? (isRental ? '<span class="badge bg-primary">ผู้เช่า</span>' : '<span class="badge bg-primary">ผู้ซื้อ</span>') 
                    : (isRental ? '<span class="badge bg-warning text-dark">ผู้ให้เช่า</span>' : '<span class="badge bg-success">ผู้ขาย</span>');
                
                let actionBtn = '';
                if (t.status === 'completed' || t.status === 'cancelled' || t.status === 'released') {
                    actionBtn = '';
                } else if (isRental) {
                    const isShipped = t.shipping_status === 'shipped' || t.shipping_status === 'delivered';
                    const isRentingOrBeyond = ['renting', 'returning', 'returned', 'damage_claimed'].includes(t.rental_status);

                    if (isBuyer) {
                        if (!isRentingOrBeyond && isShipped) {
                            actionBtn = `<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="${t.trans_id}" data-item-id="${t.item_id}" data-item-title="${escapeHtml(t.title)}" data-seller-id="${t.giver_id}" data-seller-name="${escapeHtml(t.seller_name)}" data-is-rent="true">✅ ยืนยันได้รับสินค้าแล้ว (เริ่มเช่า)</button>`;
                        } else if (t.status === 'renting' || t.rental_status === 'renting') {
                            actionBtn = `<button class="btn btn-sm btn-warning text-dark fw-bold mt-2 return-item-btn" data-id="${t.trans_id}">📦 แจ้งส่งคืนสินค้า</button>`;
                        }
                    } else {
                        if (t.rental_status === 'returning') {
                            actionBtn = `
                                <div class="d-flex flex-wrap gap-2 mt-2">
                                    <button class="btn btn-sm btn-success fw-bold confirm-return-btn" data-id="${t.trans_id}">
                                        ✅ ได้รับของคืนสมบูรณ์ (อนุมัติคืนมัดจำ)
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger fw-bold claim-damage-btn" data-id="${t.trans_id}" data-item-id="${t.item_id}" data-item-title="${escapeHtml(t.title)}" data-deposit="${t.deposit_amount || 0}" data-buyer-id="${t.receiver_id}" data-buyer-name="${escapeHtml(t.buyer_name)}">
                                        ⚠️ พบของชำรุด / ขอหักมัดจำ
                                    </button>
                                </div>
                            `;
                        } else if (!isShipped && !isRentingOrBeyond && (t.rental_status === 'paid' || t.status === 'paid')) {
                            actionBtn = `<button class="btn btn-sm btn-primary mt-2 ship-item-btn" data-id="${t.trans_id}">📦 แจ้งส่งมอบ / จัดส่งสินค้า</button>`;
                        }
                    }
                } else {
                    const isShipped = t.shipping_status === 'shipped' || t.shipping_status === 'delivered';
                    if (isBuyer && isShipped) {
                        actionBtn = `<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="${t.trans_id}" data-item-id="${t.item_id}" data-item-title="${escapeHtml(t.title)}" data-seller-id="${t.giver_id}" data-seller-name="${escapeHtml(t.seller_name)}" data-is-rent="false">✅ ยืนยันได้รับสินค้าแล้ว</button>`;
                    } else if (!isBuyer && t.status === 'paid' && !isShipped) {
                        actionBtn = `<button class="btn btn-sm btn-primary mt-2 ship-item-btn" data-id="${t.trans_id}">📦 แจ้งจัดส่งสินค้า</button>`;
                    }
                }

                // ส่วนแสดงข้อมูลการเช่า
                let rentalDetailsHTML = '';
                if (isRental) {
                    const startFormatted = t.rental_start_date ? String(t.rental_start_date).split('T')[0] : '-';
                    const endFormatted = t.rental_end_date ? String(t.rental_end_date).split('T')[0] : '-';
                    rentalDetailsHTML = `
                        <div class="small bg-warning bg-opacity-10 rounded-3 p-2 my-2 border border-warning-subtle">
                            <div>📅 <strong>ระยะเวลาเช่า:</strong> ${startFormatted} ถึง ${endFormatted} (${t.rental_days || 1} วัน)</div>
                            <div>🛡️ <strong>เงินมัดจำ:</strong> ฿${Number(t.deposit_amount || 0).toLocaleString()} <span class="text-muted">(จะคืนเมื่อส่งของครบ)</span></div>
                            ${t.return_tracking ? `<div>🚚 <strong>ข้อมูลส่งคืน:</strong> ${escapeHtml(t.return_tracking)}</div>` : ''}
                        </div>
                    `;
                }

                // กล่องแจ้งเตือนความเสียหาย/ขอหักมัดจำ (Claim Box)
                let claimBoxHTML = '';
                if (isRental && (t.rental_status === 'damage_claimed' || t.claim_status === 'pending' || t.claim_status === 'accepted' || t.claim_status === 'rejected')) {
                    if (isBuyer) {
                        claimBoxHTML = `
                            <div class="alert alert-warning p-3 mt-2 mb-2 rounded-3 border border-warning shadow-sm">
                                <div class="fw-bold text-dark d-flex align-items-center gap-1 mb-1">
                                    <i class="bi bi-exclamation-triangle-fill text-warning"></i>
                                    <span>ผู้ให้เช่าแจ้งพบความเสียหายบนสินค้า</span>
                                </div>
                                <div class="small text-muted mb-2">
                                    <div><strong>ยอดเงินที่ขอหักจากมัดจำ:</strong> <span class="text-danger fw-bold fs-6">฿${Number(t.claim_amount || 0).toLocaleString()}</span> (จากเงินมัดจำทั้งหมด ฿${Number(t.deposit_amount || 0).toLocaleString()})</div>
                                    <div><strong>รายละเอียดความเสียหาย:</strong> ${escapeHtml(t.claim_reason || 'ไม่ได้ระบุ')}</div>
                                    ${t.claim_image ? `<div class="mt-1"><a href="${t.claim_image}" target="_blank" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.8rem;"><i class="bi bi-image me-1"></i>ดูรูปถ่ายความเสียหาย</a></div>` : ''}
                                </div>
                                ${t.claim_status === 'pending' ? `
                                    <div class="d-flex flex-wrap gap-2 mt-2">
                                        <button class="btn btn-sm btn-success fw-bold accept-claim-btn" data-id="${t.trans_id}">
                                            <i class="bi bi-check-circle me-1"></i>ยินยอมให้หักเงินมัดจำ
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger fw-bold dispute-claim-btn" data-id="${t.trans_id}">
                                            <i class="bi bi-x-circle me-1"></i>ไม่ยินยอม / ให้แอดมินตัดสิน
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary fw-bold open-claim-chat-btn" data-user-id="${t.giver_id}" data-item-id="${t.item_id}" data-title="${escapeHtml(t.title)}">
                                            <i class="bi bi-chat-dots me-1"></i>ทักแชทเจรจากับผู้ให้เช่า
                                        </button>
                                    </div>
                                ` : t.claim_status === 'accepted' ? `
                                    <span class="badge bg-success-subtle text-success border border-success px-2 py-1"><i class="bi bi-check2-all me-1"></i>คุณได้ยินยอมยอดหักมัดจำแล้ว แอดมินจะดำเนินการโอนเงินให้</span>
                                ` : `
                                    <span class="badge bg-danger-subtle text-danger border border-danger px-2 py-1"><i class="bi bi-shield-exclamation me-1"></i>คุณปฏิเสธยอดหัก เรื่องถูกส่งให้แอดมินพิจารณาตัดสินชี้ขาด</span>
                                `}
                            </div>
                        `;
                    } else {
                        claimBoxHTML = `
                            <div class="alert alert-info p-3 mt-2 mb-2 rounded-3 border border-info shadow-sm small">
                                <div class="fw-bold text-dark mb-1"><i class="bi bi-info-circle me-1"></i>คุณได้ยื่นขอหักเงินมัดจำ ฿${Number(t.claim_amount || 0).toLocaleString()}</div>
                                <div class="text-muted"><strong>รายละเอียด:</strong> ${escapeHtml(t.claim_reason || '')}</div>
                                ${t.claim_image ? `<div class="mt-1"><a href="${t.claim_image}" target="_blank" class="btn btn-sm btn-outline-secondary py-0 px-2" style="font-size: 0.8rem;"><i class="bi bi-image me-1"></i>ดูรูปถ่ายความเสียหายที่คุณแนบ</a></div>` : ''}
                                <div class="mt-2">
                                    <strong>สถานะการยินยอม:</strong> 
                                    ${t.claim_status === 'accepted' 
                                        ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>ผู้เช่ายินยอมแล้ว (รอแอดมินโอนเงิน)</span>' 
                                        : t.claim_status === 'rejected' 
                                            ? '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>ผู้เช่าไม่ยินยอม (แอดมินกำลังตัดสิน)</span>' 
                                            : '<span class="badge bg-warning text-dark"><i class="bi bi-clock me-1"></i>รอผู้เช่าพิจารณา</span>'}
                                </div>
                                <div class="mt-2">
                                    <button class="btn btn-sm btn-outline-primary fw-bold open-claim-chat-btn" data-user-id="${t.receiver_id}" data-item-id="${t.item_id}" data-title="${escapeHtml(t.title)}">
                                        <i class="bi bi-chat-dots me-1"></i>เปิดแชทคุยกับผู้เช่า
                                    </button>
                                </div>
                            </div>
                        `;
                    }
                }

                return `
                    <div class="border rounded-3 p-3 mb-3 shadow-sm bg-white tx-card ${actionNotice ? 'border-2 border-danger' : ''}" data-tx-group="${txGroup}">
                        ${actionNotice ? `<div class="mb-2"><span class="badge ${actionNotice.cls} py-1 px-2 shadow-sm"><i class="bi bi-bell-fill me-1"></i>${actionNotice.text}</span></div>` : ''}
                        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                            <div class="d-flex align-items-center gap-2">
                                ${isRental ? '<span class="badge bg-warning text-dark">ให้เช่า</span>' : '<span class="badge bg-info text-dark">ซื้อขาย</span>'}
                                <h6 class="mb-0 fw-bold">${escapeHtml(t.title)}</h6>
                            </div>
                            ${roleText}
                        </div>
                        <div class="d-flex gap-3">
                            <img src="${t.image_url || 'https://via.placeholder.com/80'}" class="rounded object-fit-cover" width="80" height="80">
                            <div class="flex-grow-1">
                                <div class="small text-muted mb-1">คู่กรณี: ${escapeHtml(isBuyer ? t.seller_name : t.buyer_name)}</div>
                                <div class="fw-bold text-success mb-1">ยอดรวม: ฿${Number(t.amount).toLocaleString()}</div>
                                ${rentalDetailsHTML}
                                ${claimBoxHTML}
                                <div>${(() => {
                                    if (t.status === 'completed' || Boolean(t.admin_slip) || Boolean(t.deposit_refund_slip)) {
                                        let slipHtml = '';
                                        if (isRental) {
                                            if (!isBuyer && t.admin_slip) {
                                                slipHtml += `<br><a href="${t.admin_slip}" target="_blank" class="btn btn-sm btn-outline-success mt-1 py-0 px-2" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>ดูสลิปโอนค่าเช่า+ค่าชดเชย</a>`;
                                            } else if (isBuyer && t.deposit_refund_slip) {
                                                slipHtml += `<br><a href="${t.deposit_refund_slip}" target="_blank" class="btn btn-sm btn-outline-primary mt-1 py-0 px-2" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>ดูสลิปโอนคืนเงินมัดจำ</a>`;
                                            } else if (isBuyer && !t.deposit_refund_slip && Number(t.claim_amount) >= Number(t.deposit_amount) && Number(t.deposit_amount) > 0) {
                                                slipHtml += `<br><small class="text-danger d-block mt-1" style="font-size: 0.75rem;"><i class="bi bi-info-circle me-1"></i>หักมัดจำเต็มจำนวน (ไม่มีเงินมัดจำคืน)</small>`;
                                            }
                                        } else {
                                            const slip = !isBuyer ? t.admin_slip : t.payment_reference;
                                            if (slip) {
                                                slipHtml += `<br><a href="${slip}" target="_blank" class="btn btn-sm btn-outline-success mt-1 py-0 px-2" style="font-size: 0.75rem;"><i class="bi bi-receipt me-1"></i>ดูสลิปโอนเงิน</a>`;
                                            }
                                        }
                                        return '<span class="badge bg-success"><i class="bi bi-check-circle-fill me-1"></i>ทำธุรกรรมสำเร็จเรียบร้อย</span>' + slipHtml;
                                    } else if (isRental && t.rental_status === 'damage_claimed') {
                                        return '<span class="badge bg-danger"><i class="bi bi-exclamation-triangle-fill me-1"></i>พบของชำรุด (ขอหักมัดจำ)</span>';
                                    } else if (t.rental_status === 'returned' || (isRental && t.status === 'released')) {
                                        return '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>คืนของแล้ว รอแอดมินโอนค่าเช่าและคืนมัดจำ</span>';
                                    } else if (t.rental_status === 'returning') {
                                        return '<span class="badge bg-warning text-dark"><i class="bi bi-arrow-return-left me-1"></i>ผู้เช่าแจ้งส่งคืนแล้ว (รอผู้ให้เช่าตรวจรับ)</span>';
                                    } else if (t.status === 'renting' || t.rental_status === 'renting') {
                                        return '<span class="badge bg-info text-dark"><i class="bi bi-clock-history me-1"></i>อยู่ในระยะเวลาเช่าสินค้า</span>';
                                    } else if (t.status === 'released') {
                                        return '<span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>รอแอดมินโอนเงิน</span>';
                                    } else if (t.status === 'shipped') {
                                        return '<span class="badge bg-primary"><i class="bi bi-truck me-1"></i>จัดส่ง / ส่งมอบแล้ว</span>';
                                    } else if (t.status === 'paid') {
                                        return '<span class="badge bg-info text-dark">ชำระเงินแล้ว (รอจัดส่ง)</span>';
                                    } else if (t.status === 'awaiting_payment') {
                                        return '<span class="badge bg-secondary">รอชำระเงิน</span>';
                                    } else if (t.status === 'cancelled') {
                                        return '<span class="badge bg-danger">ยกเลิกแล้ว</span>';
                                    } else {
                                        return `<span class="badge bg-secondary">${escapeHtml(t.status)}</span>`;
                                    }
                                })()}</div>
                                ${actionBtn}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (data.transactions.length === 0) {
                trs = '<div class="text-center text-muted my-5">ไม่มีประวัติการทำรายการ</div>';
            }

            const filterTabsHtml = data.transactions.length > 0 ? `
                <div class="d-flex gap-2 mb-3 pb-2 border-bottom" id="txFilterButtons">
                    <button class="btn btn-sm btn-primary rounded-pill px-3 fw-bold tx-filter-btn" data-filter="all">ทั้งหมด (${data.transactions.length})</button>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold tx-filter-btn position-relative" data-filter="active">
                        กำลังดำเนินการ ${activeCount > 0 ? `<span class="badge bg-danger rounded-pill ms-1">${activeCount}</span>` : ''}
                    </button>
                    <button class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold tx-filter-btn" data-filter="completed">เสร็จสิ้น (${completedCount})</button>
                </div>
            ` : '';

            const modalHtml = `
                <div class="modal fade" id="myTransactionsModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-scrollable" style="max-width: 600px;">
                        <div class="modal-content rounded-4 border-0 shadow">
                            <div class="modal-header bg-primary text-white border-0">
                                <h5 class="modal-title fw-bold d-flex align-items-center">
                                    <i class="bi bi-shield-check me-2"></i>ประวัติทำรายการผ่านคนกลาง
                                    ${activeCount > 0 ? `<span class="badge bg-warning text-dark fs-6 ms-2 py-1 px-2 rounded-pill" style="font-size: 0.72rem !important;"><i class="bi bi-lightning-charge-fill me-1"></i>${activeCount} กำลังดำเนินการ</span>` : ''}
                                </h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body bg-light">
                                ${filterTabsHtml}
                                <div id="txListContainer">
                                    ${trs}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('myTransactionsModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => {
                modalEl.remove();
                updateTransactionsBadge();
            }, { once: true });

            // ตัวกรองแท็บ (ทั้งหมด / กำลังดำเนินการ / เสร็จสิ้น)
            modalEl.querySelectorAll('.tx-filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modalEl.querySelectorAll('.tx-filter-btn').forEach(b => {
                        b.classList.remove('btn-primary');
                        b.classList.add('btn-outline-secondary');
                    });
                    btn.classList.remove('btn-outline-secondary');
                    btn.classList.add('btn-primary');

                    const filter = btn.dataset.filter;
                    modalEl.querySelectorAll('.tx-card').forEach(card => {
                        const group = card.dataset.txGroup;
                        if (filter === 'all') {
                            card.style.display = 'block';
                        } else if (filter === 'active') {
                            card.style.display = group === 'active' ? 'block' : 'none';
                        } else if (filter === 'completed') {
                            card.style.display = group === 'completed' ? 'block' : 'none';
                        }
                    });
                });
            });

            // 1. ปุ่มยืนยันรับสินค้า
            modalEl.querySelectorAll('.confirm-receive-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.target;
                    const tId = target.dataset.id;
                    const itemId = target.dataset.itemId;
                    const sellerId = target.dataset.sellerId;
                    const sellerName = target.dataset.sellerName;
                    const itemTitle = target.dataset.itemTitle;
                    const isRent = target.dataset.isRent === 'true';

                    const confirmMsg = isRent
                        ? 'ยืนยันว่าคุณได้รับสินค้าสำหรับเช่าเรียบร้อยแล้วใช่หรือไม่? (ระบบจะเริ่มนับระยะเวลาการเช่า)'
                        : 'ยืนยันว่าคุณได้รับสินค้าชิ้นนี้เรียบร้อยแล้วใช่หรือไม่? (เมื่อยืนยันแล้ว แอดมินจะทำการโอนเงินให้ผู้ขาย)';

                    if (!confirm(confirmMsg)) return;
                    
                    try {
                        const res = await requestJson(`/api/transactions/${tId}/confirm`, { method: 'POST' });
                        alert(res.message || '✅ ยืนยันรับสินค้าเรียบร้อยแล้ว!');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload

                        if (!isRent && window.openReviewModal && sellerId) {
                            window.openReviewModal(itemId, sellerId, sellerName, itemTitle);
                        }
                    } catch(err) {
                        alert('ยืนยันไม่สำเร็จ: ' + err.message);
                    }
                });
            });

            // 2. ปุ่มแจ้งจัดส่งสินค้า (ผู้ขาย / ผู้ให้เช่า)
            modalEl.querySelectorAll('.ship-item-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    const tracking = prompt('กรุณากรอกหมายเลขพัสดุ หรือรายละเอียดการส่งมอบ:');
                    if (tracking === null) return;
                    
                    try {
                        const res = await requestJson(`/api/transactions/${tId}/ship`, { 
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tracking_number: tracking })
                        });
                        alert('📦 แจ้งจัดส่งเรียบร้อยแล้ว!');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload
                    } catch(err) {
                        alert('แจ้งจัดส่งไม่สำเร็จ: ' + err.message);
                    }
                });
            });

            // 3. ปุ่มผู้เช่าแจ้งส่งคืนสินค้า
            modalEl.querySelectorAll('.return-item-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    const returnTracking = prompt('กรุณาระบุเลขพัสดุที่ส่งคืน หรือรายละเอียดการนัดส่งคืนสินค้า:');
                    if (returnTracking === null) return;

                    try {
                        const res = await requestJson(`/api/transactions/${tId}/return`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ return_tracking: returnTracking })
                        });
                        alert('📦 แจ้งส่งคืนสินค้าเรียบร้อยแล้ว! เมื่อผู้ให้เช่าตรวจรับของเรียบร้อย แอดมินจะคืนเงินมัดจำให้ครับ');
                        modal.hide();
                        window.openMyTransactionsModal();
                    } catch (err) {
                        alert('แจ้งส่งคืนไม่สำเร็จ: ' + err.message);
                    }
                });
            });

            // 4. ปุ่มผู้ให้เช่ายืนยันได้รับสินค้าคืนเรียบร้อย
            modalEl.querySelectorAll('.confirm-return-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    if (!confirm('ยืนยันว่าคุณได้รับสินค้าคืนในสภาพสมบูรณ์เรียบร้อยแล้วใช่หรือไม่?\n(ระบบจะแจ้งแอดมินให้โอนค่าเช่าให้คุณ และคืนเงินมัดจำให้ผู้เช่า)')) return;

                    try {
                        const res = await requestJson(`/api/transactions/${tId}/confirm-return`, { method: 'POST' });
                        alert('✅ ตรวจรับสินค้าคืนเรียบร้อย! แอดมินจะดำเนินการโอนค่าเช่าให้คุณและคืนมัดจำให้ผู้เช่า');
                        modal.hide();
                        window.openMyTransactionsModal();
                    } catch (err) {
                        alert('ดำเนินการไม่สำเร็จ: ' + err.message);
                    }
                });
            });

            // 5. จัดการ Modal แจ้งพบของชำรุด / ขอหักมัดจำ
            if (!document.getElementById('claimDamageModal')) {
                document.body.insertAdjacentHTML('beforeend', `
                    <div class="modal fade" id="claimDamageModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered">
                            <div class="modal-content border-0 shadow-lg rounded-4">
                                <div class="modal-header bg-danger text-white">
                                    <h5 class="modal-title fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>แจ้งพบของชำรุด / ขอหักเงินมัดจำ</h5>
                                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body p-4">
                                    <p class="text-muted mb-3 small">
                                        หากสินค้าที่ส่งคืนมีรอยแตก หัก หรืออุปกรณ์ชำรุดสูญหาย ท่านสามารถระบุจำนวนเงินที่ขอหักจากเงินมัดจำ และแนบรูปหลักฐานเพื่อให้ผู้เช่าและแอดมินตรวจสอบ
                                    </p>
                                    <input type="hidden" id="claimTxId">
                                    <input type="hidden" id="claimMaxDeposit">
                                    <input type="hidden" id="claimBuyerId">
                                    <input type="hidden" id="claimItemId">
                                    <input type="hidden" id="claimItemTitle">

                                    <div class="mb-3">
                                        <label class="form-label fw-bold text-dark">จำนวนเงินที่ขอหักจากมัดจำ (บาท) <span class="text-danger">*</span></label>
                                        <div class="input-group">
                                            <input type="number" class="form-control form-control-lg border-2" id="claimAmountInput" placeholder="0" min="1">
                                            <span class="input-group-text">บาท</span>
                                        </div>
                                        <div class="form-text text-danger fw-bold" id="claimMaxDepositHint">เงินมัดจำสูงสุดที่มีอยู่: ฿0</div>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold text-dark">รายละเอียดความเสียหาย / อะไหล่ที่ชำรุด <span class="text-danger">*</span></label>
                                        <textarea class="form-control border-2" id="claimReasonInput" rows="3" placeholder="ระบุจุดที่เสียหาย เช่น ตัวล็อกขาตั้งหัก, เลนส์มีรอยแตก..."></textarea>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label fw-bold text-dark">แนบรูปถ่ายหลักฐานความเสียหาย</label>
                                        <input type="file" class="form-control border-2" id="claimImageInput" accept="image/*">
                                    </div>
                                    <div class="d-flex gap-2 mt-4">
                                        <button type="button" class="btn btn-outline-primary flex-fill fw-bold py-2" id="claimOpenChatBtn">
                                            <i class="bi bi-chat-dots me-1"></i>เปิดแชทคุยกับผู้เช่าก่อน
                                        </button>
                                        <button type="button" class="btn btn-danger flex-fill fw-bold py-2" id="submitClaimBtn">
                                            <i class="bi bi-send-fill me-1"></i>ส่งคำขอหักมัดจำ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);

                document.getElementById('claimOpenChatBtn')?.addEventListener('click', () => {
                    const buyerId = document.getElementById('claimBuyerId').value;
                    const itemId = document.getElementById('claimItemId').value;
                    const title = document.getElementById('claimItemTitle').value;
                    const claimModal = bootstrap.Modal.getInstance(document.getElementById('claimDamageModal'));
                    if (claimModal) claimModal.hide();
                    if (window.openChat) window.openChat(buyerId, title, itemId);
                });

                document.getElementById('submitClaimBtn')?.addEventListener('click', async () => {
                    const txId = document.getElementById('claimTxId').value;
                    const amount = Number(document.getElementById('claimAmountInput').value || 0);
                    const maxDeposit = Number(document.getElementById('claimMaxDeposit').value || 0);
                    const reason = document.getElementById('claimReasonInput').value.trim();
                    const imageFile = document.getElementById('claimImageInput').files[0];

                    if (!amount || amount <= 0) {
                        return alert('กรุณาระบุจำนวนเงินที่ต้องการขอหักจากมัดจำให้ถูกต้อง');
                    }
                    if (amount > maxDeposit) {
                        return alert(`ยอดเงินที่ขอหักต้องไม่เกินเงินมัดจำที่มีอยู่ (฿${maxDeposit.toLocaleString()})`);
                    }
                    if (!reason) {
                        return alert('กรุณากรอกรายละเอียดความเสียหาย');
                    }

                    const formData = new FormData();
                    formData.append('claim_amount', amount);
                    formData.append('claim_reason', reason);
                    if (imageFile) formData.append('claim_image', imageFile);

                    try {
                        const submitBtn = document.getElementById('submitClaimBtn');
                        submitBtn.disabled = true;
                        const res = await fetch(`/api/transactions/${txId}/claim-damage`, {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('authToken') },
                            body: formData
                        });
                        const data = await res.json();
                        submitBtn.disabled = false;

                        if (!data.success) throw new Error(data.message || 'ส่งคำขอไม่สำเร็จ');

                        alert('⚠️ ส่งคำขอหักเงินมัดจำเรียบร้อยแล้ว!\nระบบได้แจ้งไปยังผู้เช่าเพื่อพิจารณาความยินยอม และแอดมินได้รับเรื่องเรียบร้อยแล้ว');
                        const claimModal = bootstrap.Modal.getInstance(document.getElementById('claimDamageModal'));
                        if (claimModal) claimModal.hide();
                        modal.hide();
                        window.openMyTransactionsModal();
                    } catch (err) {
                        alert(err.message);
                    }
                });
            }

            // ปุ่มเปิด Modal แจ้งของชำรุด
            modalEl.querySelectorAll('.claim-damage-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetBtn = e.target.closest('.claim-damage-btn');
                    document.getElementById('claimTxId').value = targetBtn.dataset.id;
                    const dep = Number(targetBtn.dataset.deposit || 0);
                    document.getElementById('claimMaxDeposit').value = dep;
                    document.getElementById('claimMaxDepositHint').textContent = `เงินมัดจำสูงสุดที่มีอยู่: ฿${dep.toLocaleString()}`;
                    document.getElementById('claimAmountInput').value = dep > 0 ? dep : '';
                    document.getElementById('claimAmountInput').max = dep;
                    document.getElementById('claimBuyerId').value = targetBtn.dataset.buyerId || '';
                    document.getElementById('claimItemId').value = targetBtn.dataset.itemId || '';
                    document.getElementById('claimItemTitle').value = targetBtn.dataset.itemTitle || '';
                    document.getElementById('claimReasonInput').value = '';
                    document.getElementById('claimImageInput').value = '';

                    const claimModal = new bootstrap.Modal(document.getElementById('claimDamageModal'));
                    claimModal.show();
                });
            });

            // ปุ่มผู้เช่ายินยอมให้หักมัดจำ
            modalEl.querySelectorAll('.accept-claim-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    if (!confirm('ยืนยันยินยอมให้หักเงินมัดจำตามที่ผู้ให้เช่าร้องขอใช่หรือไม่?\n(แอดมินจะดำเนินการโอนเงินมัดจำชดเชยให้ผู้ให้เช่า และคืนเงินมัดจำส่วนที่เหลือให้คุณ)')) return;

                    try {
                        const res = await requestJson(`/api/transactions/${tId}/respond-claim`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'accept' })
                        });
                        alert('✅ ' + res.message);
                        modal.hide();
                        window.openMyTransactionsModal();
                    } catch (err) {
                        alert(err.message);
                    }
                });
            });

            // ปุ่มผู้เช่าไม่ยินยอมให้หักมัดจำ
            modalEl.querySelectorAll('.dispute-claim-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    if (!confirm('ยืนยันปฏิเสธยอดหักเงินมัดจำนี้ใช่หรือไม่?\n(ข้อพิพาทจะถูกส่งไปยังแอดมินคนกลาง เพื่อตรวจสอบหลักฐานรูปภาพและตัดสินชี้ขาด)')) return;

                    try {
                        const res = await requestJson(`/api/transactions/${tId}/respond-claim`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'dispute' })
                        });
                        alert('⚠️ ' + res.message);
                        modal.hide();
                        window.openMyTransactionsModal();
                    } catch (err) {
                        alert(err.message);
                    }
                });
            });

            // ปุ่มเปิดแชทกับคู่กรณีในหน้าความเสียหาย
            modalEl.querySelectorAll('.open-claim-chat-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetBtn = e.target.closest('.open-claim-chat-btn');
                    const userId = targetBtn.dataset.userId;
                    const itemId = targetBtn.dataset.itemId;
                    const title = targetBtn.dataset.title;
                    modal.hide();
                    if (window.openChat) window.openChat(userId, title, itemId);
                });
            });

        } catch (error) {
            alert('ดึงประวัติไม่ได้: ' + error.message);
        }
    };

    // เริ่มต้นตรวจสอบและอัปเดตตัวเลขแจ้งเตือน
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateTransactionsBadge);
    } else {
        updateTransactionsBadge();
    }
    setInterval(updateTransactionsBadge, 15000);

})();

