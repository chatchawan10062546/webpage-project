// ====================================================
// 💳 transactions.js : เริ่มและชำระธุรกรรมคนกลาง (โหมดทดสอบ)
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

    function renderPaymentModal(item, transactionId, amount) {
        document.getElementById('paymentModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="paymentModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">ชำระเงินผ่านระบบคนกลาง</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-0">
                            <!-- ภาพแบบ Edge-to-edge -->
                            <div class="position-relative">
                                <img src="${item.images?.[0] || 'https://via.placeholder.com/600x300'}" class="w-100 object-fit-cover" style="height: 280px;" alt="">
                                <div class="position-absolute bottom-0 start-0 w-100 p-4" style="background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);">
                                    <h3 class="fw-bold text-white mb-0 text-truncate">${escapeHtml(item.title)}</h3>
                                </div>
                            </div>
                            
                            <div class="p-4">
                                <!-- ราคา -->
                                <div class="d-flex justify-content-between align-items-center mb-4 bg-light rounded-4 p-4 border shadow-sm">
                                    <span class="text-muted fw-bold fs-5">ยอดที่ต้องชำระ</span>
                                    <span class="text-success fw-bold display-6 mb-0">฿${Number(amount).toLocaleString()}</span>
                                </div>

                                <!-- ขั้นตอน -->
                                <div class="px-2 mb-3 mt-4">
                                    <div class="d-flex justify-content-between position-relative mb-2">
                                        <div class="progress position-absolute top-50 start-0 w-100 translate-middle-y" style="height: 4px; z-index: 1;">
                                            <div class="progress-bar bg-success" style="width: 25%"></div>
                                        </div>
                                        <div class="position-relative bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">1</div>
                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">2</div>
                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">3</div>
                                        <div class="position-relative bg-white text-muted rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm border border-2" style="width: 32px; height: 32px; z-index: 2; font-size: 0.95rem;">4</div>
                                    </div>
                                    <div class="d-flex justify-content-between small text-center" style="font-size: 0.75rem;">
                                        <div class="text-success fw-bold" style="width: 25%; margin-left: -10%;">ชำระเงิน</div>
                                        <div class="text-muted" style="width: 25%;">ระบบพักเงิน</div>
                                        <div class="text-muted" style="width: 25%;">คนขายส่งของ</div>
                                        <div class="text-muted" style="width: 25%; margin-right: -10%;">รับของแล้ว</div>
                                    </div>
                                </div>

                                <hr class="my-4 text-muted">

                                <!-- สแกน QR -->
                                <div class="text-center bg-light rounded-4 p-4 border mb-4 shadow-sm">
                                    <div class="fw-bold text-dark mb-3 fs-5"><i class="bi bi-qr-code-scan me-2"></i>สแกนจ่ายผ่านบัญชีกองกลาง</div>
                                    <div class="bg-white p-2 d-inline-block rounded-4 shadow-sm mb-3">
                                        <img src="https://promptpay.io/0800000000/${amount}.png" class="img-fluid" style="max-width: 220px;" alt="QR Code กองกลาง">
                                    </div>
                                    <div class="text-muted bg-white border rounded-pill py-2 px-4 d-inline-block shadow-sm">
                                        พร้อมเพย์: <span class="fw-bold text-dark fs-5 ms-1">080-000-0000</span> (แอดมิน ปันสุข)
                                    </div>
                                </div>
                                
                                <div class="alert alert-warning border-0 shadow-sm d-flex align-items-center rounded-4 mb-4">
                                    <i class="bi bi-info-circle-fill text-warning fs-3 me-3"></i>
                                    <div><strong>โหมดทดสอบ:</strong> ยังไม่มีการหักเงินจริง เงินจะถูกจำลองเป็นเงินพักในระบบเมื่อกดยืนยัน</div>
                                </div>

                                <div class="mb-4">
                                    <label class="form-label fw-bold text-dark"><i class="bi bi-receipt me-2"></i>แนบหลักฐานการโอนเงิน (สลิป)</label>
                                    <input class="form-control form-control-lg border-2 shadow-sm" type="file" id="slipUpload" accept="image/jpeg, image/png">
                                </div>
                                <button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold shadow-sm rounded-pill fs-5" type="button"><i class="bi bi-check-circle-fill me-2"></i>ยืนยันการชำระเงิน และอัปโหลดสลิป</button>

                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('paymentModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
        document.getElementById('mockPayButton').addEventListener('click', async event => {
            const slipInput = document.getElementById('slipUpload');
            if (!slipInput.files || slipInput.files.length === 0) {
                alert('⚠️ กรุณาแนบรูปสลิปหลักฐานการโอนเงินก่อนยืนยันครับ');
                return;
            }

            event.target.disabled = true;
            event.target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังอัปโหลด...';

            try {
                const result = await requestJson(`/api/transactions/${transactionId}/pay`, { method: 'POST' });
                event.target.outerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
                setTimeout(() => { modal.hide(); }, 2000);
            } catch (error) {
                event.target.disabled = false;
                event.target.innerHTML = 'ยืนยันการชำระเงิน และอัปโหลดสลิป';
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });
    }

    window.startEscrowPurchase = async item => {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');

        try {
            const result = await requestJson('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: item.itemId })
            });
            renderPaymentModal(item, result.transaction_id, result.amount || item.price);
        } catch (error) {
            alert('เริ่มธุรกรรมไม่สำเร็จ: ' + error.message);
        }
    };

    // 📌 [Phase 6] เปิดหน้าต่างประวัติการซื้อขายของฉัน
    window.openMyTransactionsModal = async () => {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบ');

        try {
            const data = await requestJson('/api/transactions/me/all');
            document.getElementById('myTransactionsModal')?.remove();

            let trs = data.transactions.map(t => {
                const isBuyer = String(t.receiver_id) === String(userId);
                const roleText = isBuyer ? '<span class="badge bg-primary">ผู้ซื้อ</span>' : '<span class="badge bg-success">ผู้ขาย</span>';
                
                // ปุ่มยืนยันรับสินค้าจะโผล่ก็ต่อเมื่อ เป็นคนซื้อ และ สถานะแอดมินยืนยันสลิปแล้ว หรือ ส่งของแล้ว
                let actionBtn = '';
                if (isBuyer && (t.status === 'paid' || t.status === 'shipped')) {
                    actionBtn = `<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="${t.trans_id}" data-item-id="${t.item_id}" data-item-title="${escapeHtml(t.title)}" data-seller-id="${t.giver_id}" data-seller-name="${escapeHtml(t.seller_name)}">✅ ยืนยันได้รับสินค้าแล้ว</button>`;
                } else if (!isBuyer && t.status === 'paid') {
                    actionBtn = `<button class="btn btn-sm btn-primary mt-2 ship-item-btn" data-id="${t.trans_id}">📦 แจ้งจัดส่งสินค้า</button>`;
                }
                return `
                    <div class="border rounded p-3 mb-3 shadow-sm bg-white">
                        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                            <h6 class="mb-0 fw-bold">${escapeHtml(t.title)}</h6>
                            ${roleText}
                        </div>
                        <div class="d-flex gap-3">
                            <img src="${t.image_url || 'https://via.placeholder.com/80'}" class="rounded object-fit-cover" width="80" height="80">
                            <div>
                                <div class="small text-muted mb-1">คู่กรณี: ${escapeHtml(isBuyer ? t.seller_name : t.buyer_name)}</div>
                                <div class="fw-bold text-success mb-1">฿${Number(t.amount).toLocaleString()}</div>
                                <div><span class="badge bg-secondary">${t.status}</span></div>
                                ${actionBtn}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (data.transactions.length === 0) {
                trs = '<div class="text-center text-muted my-5">ไม่มีประวัติการซื้อขาย</div>';
            }

            const modalHtml = `
                <div class="modal fade" id="myTransactionsModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-scrollable">
                        <div class="modal-content rounded-4 border-0 shadow">
                            <div class="modal-header bg-primary text-white border-0">
                                <h5 class="modal-title fw-bold"><i class="bi bi-bag-check me-2"></i>ประวัติซื้อขาย (คนกลาง)</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body bg-light">
                                ${trs}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('myTransactionsModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });

            // Event Listener สำหรับปุ่ม ยืนยันรับสินค้า
            modalEl.querySelectorAll('.confirm-receive-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.target;
                    const tId = target.dataset.id;
                    const itemId = target.dataset.itemId;
                    const sellerId = target.dataset.sellerId;
                    const sellerName = target.dataset.sellerName;
                    const itemTitle = target.dataset.itemTitle;

                    if(!confirm('ยืนยันว่าคุณได้รับสินค้าชิ้นนี้เรียบร้อยแล้วใช่หรือไม่? (เมื่อยืนยันแล้ว แอดมินจะทำการโอนเงินให้ผู้ขาย)')) return;
                    
                    try {
                        const res = await requestJson(`/api/transactions/${tId}/confirm`, { method: 'POST' });
                        alert('✅ ยืนยันรับสินค้าสำเร็จ! ขอบคุณที่ใช้บริการ');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload

                        if (window.openReviewModal && sellerId) {
                            window.openReviewModal(itemId, sellerId, sellerName, itemTitle);
                        }
                    } catch(err) {
                        alert('ยืนยันไม่สำเร็จ: ' + err.message);
                    }
                });
            });

            // Event Listener สำหรับปุ่ม แจ้งจัดส่งสินค้า (Seller)
            modalEl.querySelectorAll('.ship-item-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    const tracking = prompt('กรุณากรอกหมายเลขพัสดุ (ถ้ามี):');
                    if(tracking === null) return; // cancelled
                    
                    try {
                        const res = await requestJson(`/api/transactions/${tId}/ship`, { 
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tracking_number: tracking })
                        });
                        alert('📦 แจ้งจัดส่งสินค้าสำเร็จ! (ระบบจะปล่อยเงินอัตโนมัติใน 2 วัน หากผู้ซื้อไม่กดยืนยัน)');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload
                    } catch(err) {
                        alert('แจ้งจัดส่งไม่สำเร็จ: ' + err.message);
                    }
                });
            });


        } catch (error) {
            alert('ดึงประวัติไม่ได้: ' + error.message);
        }
    };

})();
