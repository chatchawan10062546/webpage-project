const fs = require('fs');
let c = fs.readFileSync('js/admin.js', 'utf8');

// Replace the simple click listener with a modal-based one
const oldClick = `    document.getElementById('adminTransactionsList').addEventListener('click', async event => {
        if (event.target.classList.contains('complete-tx-btn')) {
            if (!confirm('ยืนยันว่าได้ทำการโอนเงินเข้าบัญชีพร้อมเพย์ของผู้ขายแล้วใช่หรือไม่?')) return;
            const txId = event.target.dataset.id;
            try {
                await requestJson(\`/api/admin/transactions/\\${txId}/complete\`, { method: 'PATCH' });
                alert('บันทึกการโอนเงินสำเร็จ');
                loadView('transactions');
            } catch (error) {
                alert(error.message);
            }
        }
    });`;

const newClick = `
    // Add Admin Slip Modal to DOM if not exists
    if (!document.getElementById('adminSlipModal')) {
        document.body.insertAdjacentHTML('beforeend', \`
            <div class="modal fade" id="adminSlipModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content rounded-4 border-0 shadow-lg">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title"><i class="bi bi-wallet2 me-2"></i>อัปโหลดหลักฐานการโอนเงิน</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4">
                            <p class="text-muted mb-4">กรุณาแนบสลิปการโอนเงินเข้าบัญชีพร้อมเพย์ของผู้ขาย เพื่อเป็นหลักฐานว่าแอดมินได้ทำการโอนเงินเรียบร้อยแล้ว</p>
                            <input type="hidden" id="adminSlipTxId">
                            <div class="mb-3">
                                <label class="form-label fw-bold">แนบสลิปโอนเงิน</label>
                                <input class="form-control form-control-lg border-2 shadow-sm" type="file" id="adminSlipUpload" accept="image/jpeg, image/png">
                            </div>
                            <button id="submitAdminSlipBtn" class="btn btn-success w-100 py-3 fw-bold shadow-sm rounded-pill mt-2">
                                <i class="bi bi-check-circle-fill me-2"></i>ยืนยันและอัปโหลดสลิป
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        \`);

        document.getElementById('submitAdminSlipBtn').addEventListener('click', async () => {
            const txId = document.getElementById('adminSlipTxId').value;
            const fileInput = document.getElementById('adminSlipUpload');
            
            if (fileInput.files.length === 0) {
                alert('กรุณาแนบสลิปการโอนเงินก่อนกดยืนยัน');
                return;
            }

            const formData = new FormData();
            formData.append('slip', fileInput.files[0]);

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(\`/api/admin/transactions/\${txId}/complete\`, {
                    method: 'PATCH',
                    headers: { 'Authorization': \`Bearer \${token}\` },
                    body: formData
                });
                
                const data = await response.json();
                if (!data.success) throw new Error(data.message);
                
                alert('บันทึกการโอนเงินและอัปโหลดสลิปสำเร็จ');
                bootstrap.Modal.getInstance(document.getElementById('adminSlipModal')).hide();
                loadView('transactions');
                fileInput.value = ''; // clear input
            } catch (error) {
                alert('เกิดข้อผิดพลาด: ' + error.message);
            }
        });
    }

    document.getElementById('adminTransactionsList').addEventListener('click', event => {
        if (event.target.classList.contains('complete-tx-btn')) {
            const txId = event.target.dataset.id;
            document.getElementById('adminSlipTxId').value = txId;
            const modal = new bootstrap.Modal(document.getElementById('adminSlipModal'));
            modal.show();
        }
    });
`;

c = c.replace(oldClick, newClick);
fs.writeFileSync('js/admin.js', c, 'utf8');
console.log('Added slip modal to frontend');
