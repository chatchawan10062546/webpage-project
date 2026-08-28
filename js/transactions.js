// ====================================================
// 💳 transactions.js : เริ่มและชำระธุรกรรมคนกลาง (โหมดทดสอบ)
// ====================================================

(() => {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
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
                        <div class="modal-body p-4">
                            <div class="d-flex align-items-center gap-3 mb-4">
                                <img src="${item.images?.[0] || ''}" class="transaction-item-image" alt="">
                                <div><div class="fw-bold">${item.title}</div><div class="text-success fw-bold fs-4">฿${Number(amount).toLocaleString()}</div></div>
                            </div>
                            <div class="alert alert-info small">โหมดทดสอบ: ยังไม่มีการหักเงินจริง เงินจะถูกจำลองเป็นเงินพักในระบบ</div>
                            <div class="transaction-steps small mb-4">
                                <div class="active">1. รอชำระเงิน</div><div>2. พักเงิน</div><div>3. คนขายส่งของ</div><div>4. ยืนยันรับของ</div>
                            </div>
                            <button id="mockPayButton" class="btn btn-primary w-100 py-3 fw-bold" type="button">ยืนยันการชำระเงินจำลอง</button>
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
            event.target.disabled = true;
            try {
                const result = await requestJson(`http://localhost:3000/api/transactions/${transactionId}/pay`, { method: 'POST' });
                event.target.outerHTML = `<div class="alert alert-success mb-0">${result.message}</div>`;
            } catch (error) {
                event.target.disabled = false;
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });
    }

    window.startEscrowPurchase = async item => {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');

        try {
            const result = await requestJson('http://localhost:3000/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: item.itemId })
            });
            renderPaymentModal(item, result.transaction_id, result.amount || item.price);
        } catch (error) {
            alert('เริ่มธุรกรรมไม่สำเร็จ: ' + error.message);
        }
    };
})();
