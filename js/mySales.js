// ====================================================
// 📊 mySales.js : หน้าต่างโพสต์ของฉัน / จัดการการขาย
// ====================================================

window.openMySalesModal = async () => {
    function getUser() { return JSON.parse(localStorage.getItem('user') || 'null'); }
    function getUserId() { const u = getUser(); return u?.id || u?.user_id || u?.userId; }

    async function requestJson(url, options = {}) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    const userId = getUserId();
    if (!userId) return alert('กรุณาเข้าสู่ระบบ');

    try {
        const data = await requestJson('/api/my-sales');
        const sales = data.sales || [];
        let rowsHTML = '';
        
        if (sales.length === 0) {
            rowsHTML = `
                <div class="text-center text-muted py-5">
                    <i class="bi bi-shop fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <p class="mb-0 fs-5 fw-bold text-secondary">คุณยังไม่ได้ลงประกาศรายการใดๆ (หรือปิดการขายไปหมดแล้ว)</p>
                </div>
            `;
        } else {
            rowsHTML = sales.map(sale => {
                const typeTag = sale.item_type === 'sell' 
                    ? `<span class="badge bg-primary me-1">ขาย (฿${Number(sale.price).toLocaleString()})</span>`
                    : sale.item_type === 'rent'
                    ? `<span class="badge bg-warning text-dark me-1">ให้เช่า (฿${Number(sale.price).toLocaleString()}/วัน)</span>`
                    : `<span class="badge bg-success me-1">แจกฟรี</span>`;

                const stockLabel = sale.quantity > 0 ? `<span class="badge bg-info text-dark">เหลือ ${sale.quantity} ชิ้น</span>` : `<span class="badge bg-danger">หมด/จองแล้ว</span>`;

                let requestsHTML = '';
                if (sale.requests.length === 0) {
                    requestsHTML = '<p class="text-muted small mb-0 mt-2">ยังไม่มีผู้ส่งคำขอ</p>';
                } else {
                    requestsHTML = sale.requests.map(req => {
                        return `
                            <div class="border rounded p-2 mb-2 bg-white d-flex flex-column gap-2" data-request-id="${req.request_id}">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold small">👤 ${req.requester_name}</span>
                                    ${req.status === 'pending' ? '<span class="badge bg-warning text-dark">รอพิจารณา</span>' : '<span class="badge bg-success">ยอมรับแล้ว</span>'}
                                </div>
                                <div class="small text-secondary bg-light p-2 rounded-2 border">
                                    💬 "${req.message || 'ไม่ได้ฝากข้อความ'}"
                                </div>
                                <div class="d-flex gap-2 mt-1">
                                    ${req.status === 'pending' ? `
                                        <button class="btn btn-sm btn-success flex-grow-1 fw-bold accept-req-btn">✅ ยอมรับ</button>
                                        <button class="btn btn-sm btn-outline-danger flex-grow-1 reject-req-btn">❌ ปฏิเสธ</button>
                                    ` : `
                                        <button class="btn btn-sm btn-outline-danger w-100 fw-bold revoke-req-btn">🛑 ยึดของคืน (คนซื้อเท)</button>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                let rejectedBanner = '';
                if (sale.status === 'rejected' || sale.is_approved === 0 || sale.is_approved === false) {
                    rejectedBanner = `
                    <div class="alert alert-danger m-3 d-flex align-items-center gap-2">
                        <i class="bi bi-exclamation-triangle-fill fs-4"></i>
                        <div>
                            <strong>โพสต์นี้ไม่ผ่านการอนุมัติ (แอดมินปฏิเสธ)</strong><br>
                            เหตุผล: ${sale.rejection_reason || 'ไม่ระบุเหตุผล / ผิดกฎของแพลตฟอร์ม'}
                        </div>
                    </div>`;
                }

                return `
                    <div class="card mb-4 border-0 shadow-sm rounded-4 overflow-hidden my-sale-card" data-item-id="${sale.item_id}">${rejectedBanner}
                        <div class="card-header bg-white p-3 border-bottom d-flex gap-3 align-items-center">
                            <img src="${sale.image_url || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80'}" 
                                 class="rounded-3" style="width: 70px; height: 70px; object-fit: cover;">
                            <div class="flex-grow-1">
                                <h6 class="fw-bold mb-1 fs-5">${sale.title}</h6>
                                <div>${typeTag} ${stockLabel}</div>
                            </div>
                        </div>
                        <div class="card-body p-3 bg-light">
                            <h6 class="fw-bold text-dark mb-2">📋 รายการคำขอ (${sale.requests.length}):</h6>
                            ${requestsHTML}
                        </div>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('mySalesModal')?.remove();
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="mySalesModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div class="modal-header bg-primary text-white p-3">
                            <h5 class="modal-title fw-bold"><i class="bi bi-shop me-2"></i>จัดการโพสต์/การขายของฉัน (My Sales)</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            ${rowsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `);

        const modalElement = document.getElementById('mySalesModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

        modalElement.addEventListener('click', async (e) => {
            const reqDiv = e.target.closest('[data-request-id]');
            if (!reqDiv) return;
            const requestId = reqDiv.dataset.requestId;

            if (e.target.closest('.accept-req-btn')) {
                if (!confirm('ยืนยันยอมรับคำขอนี้? (ของจะถูกจองให้คนนี้)')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'accepted' })
                    });
                    alert(res.message);
                    modal.hide(); window.openMySalesModal(); // Refresh modal
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }
            if (e.target.closest('.reject-req-btn')) {
                if (!confirm('ปฏิเสธคำขอนี้?')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}`, {
                        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'rejected' })
                    });
                    alert(res.message);
                    modal.hide(); window.openMySalesModal();
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }
            if (e.target.closest('.revoke-req-btn')) {
                if (!confirm('ยืนยันยึดของคืนและยกเลิกคำขอนี้? (กรณีคนซื้อไม่ยอมมารับของ)')) return;
                try {
                    const res = await requestJson(`/api/item-requests/${requestId}/revoke`, {
                        method: 'PATCH'
                    });
                    alert(res.message);
                    modal.hide(); window.openMySalesModal();
                } catch(err) { alert('ผิดพลาด: ' + err.message); }
            }
        });

    } catch (error) {
        alert('เปิดหน้าต่างไม่สำเร็จ: ' + error.message);
    }
};
