const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const newCode = `
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
                if (isBuyer && t.status !== 'completed' && t.status !== 'cancelled') {
                    actionBtn = \`<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="\${t.trans_id}">✅ ยืนยันได้รับสินค้าแล้ว</button>\`;
                }

                return \`
                    <div class="border rounded p-3 mb-3 shadow-sm bg-white">
                        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                            <h6 class="mb-0 fw-bold">\${escapeHtml(t.title)}</h6>
                            \${roleText}
                        </div>
                        <div class="d-flex gap-3">
                            <img src="\${t.image_url || 'https://via.placeholder.com/80'}" class="rounded object-fit-cover" width="80" height="80">
                            <div>
                                <div class="small text-muted mb-1">คู่กรณี: \${escapeHtml(isBuyer ? t.seller_name : t.buyer_name)}</div>
                                <div class="fw-bold text-success mb-1">฿\${Number(t.amount).toLocaleString()}</div>
                                <div><span class="badge bg-secondary">\${t.status}</span></div>
                                \${actionBtn}
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');

            if (data.transactions.length === 0) {
                trs = '<div class="text-center text-muted my-5">ไม่มีประวัติการซื้อขาย</div>';
            }

            const modalHtml = \`
                <div class="modal fade" id="myTransactionsModal" tabindex="-1">
                    <div class="modal-dialog modal-dialog-scrollable">
                        <div class="modal-content rounded-4 border-0 shadow">
                            <div class="modal-header bg-primary text-white border-0">
                                <h5 class="modal-title fw-bold"><i class="bi bi-bag-check me-2"></i>ประวัติการซื้อขาย</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body bg-light">
                                \${trs}
                            </div>
                        </div>
                    </div>
                </div>
            \`;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            const modalEl = document.getElementById('myTransactionsModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();

            modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });

            // Event Listener สำหรับปุ่ม ยืนยันรับสินค้า
            modalEl.querySelectorAll('.confirm-receive-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    if(!confirm('ยืนยันว่าคุณได้รับสินค้าชิ้นนี้เรียบร้อยแล้วใช่หรือไม่? (เมื่อยืนยันแล้ว แอดมินจะทำการโอนเงินให้ผู้ขาย)')) return;
                    
                    try {
                        const res = await requestJson(\`/api/transactions/\${tId}/confirm\`, { method: 'POST' });
                        alert('✅ ยืนยันรับสินค้าสำเร็จ! ขอบคุณที่ใช้บริการ');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload
                    } catch(err) {
                        alert('ยืนยันไม่สำเร็จ: ' + err.message);
                    }
                });
            });

        } catch (error) {
            alert('ดึงประวัติไม่ได้: ' + error.message);
        }
    };
`;

c = c.replace('})();', newCode + '\n})();');
fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Added openMyTransactionsModal to transactions.js');
