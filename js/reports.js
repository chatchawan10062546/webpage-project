// ====================================================
// 🚩 reports.js : ฟอร์มแจ้งปัญหาสำหรับผู้ใช้ที่ล็อกอิน
// ====================================================

window.openReportModal = function(itemId = null, reportedUserId = null, contextTitle = '') {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    if (!getUser()) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการรายงาน');
        return;
    }

    async function requestJson(url, options = {}) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    document.getElementById('reportModal')?.remove();
    
    let contextHTML = '';
    if (contextTitle) {
        contextHTML = `
            <div class="alert alert-warning mb-3">
                <strong>กำลังรายงาน:</strong> ${contextTitle}
            </div>
        `;
    }

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="reportModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title fw-bold">🚨 รายงานปัญหา / แจ้งมิจฉาชีพ</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="reportForm">
                        <div class="modal-body p-4">
                            ${contextHTML}
                            <input type="hidden" id="reportItemId" value="${itemId || ''}">
                            <input type="hidden" id="reportUserId" value="${reportedUserId || ''}">
                            
                            <label class="form-label fw-bold">หมวดหมู่ปัญหา <span class="text-danger">*</span></label>
                            <select id="reportCategory" class="form-select mb-3" required>
                                <option value="" selected disabled>-- เลือกหมวดหมู่ --</option>
                                <option value="หลอกลวง / มิจฉาชีพ">⚠️ หลอกลวง / มิจฉาชีพ (เช่น ขอให้โอนเงินก่อน)</option>
                                <option value="สินค้าผิดกฎหมาย">🚫 สินค้าผิดกฎหมาย / อันตราย / ผิดข้อตกลง</option>
                                <option value="สแปม / ก่อกวน">💬 สแปม / ใช้คำพูดไม่เหมาะสม / ก่อกวน</option>
                                <option value="อื่นๆ">❓ อื่นๆ</option>
                            </select>

                            <label class="form-label fw-bold" for="reportReason">รายละเอียดเพิ่มเติม <span class="text-danger">*</span></label>
                            <textarea id="reportReason" class="form-control" rows="4" maxlength="2000" placeholder="อธิบายพฤติกรรม หรือรายละเอียดของปัญหาให้ทีมงานทราบ..." required></textarea>
                            
                            <div class="form-text text-muted mt-2">
                                <i class="bi bi-shield-lock"></i> ข้อมูลการรายงานของคุณจะถูกเก็บเป็นความลับและส่งตรงถึงทีมงานเท่านั้น
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">ยกเลิก</button>
                            <button type="submit" class="btn btn-danger rounded-pill px-4 fw-bold">ส่งรายงาน</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    const modalElement = document.getElementById('reportModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

    document.getElementById('reportForm').addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        
        const category = document.getElementById('reportCategory').value;
        const details = document.getElementById('reportReason').value;
        const fullReason = `[${category}] ${details}`;
        
        try {
            const result = await requestJson('http://localhost:3000/api/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: document.getElementById('reportItemId').value || null,
                    reported_user_id: document.getElementById('reportUserId').value || null,
                    reason: fullReason
                })
            });
            modal.hide();
            alert('ขอบคุณสำหรับการรายงาน ทีมงานจะรีบตรวจสอบโดยเร็วที่สุดครับ');
        } catch (error) {
            submitButton.disabled = false;
            alert('ส่งรายงานไม่สำเร็จ: ' + error.message);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // สำหรับปุ่มแจ้งปัญหาเดิมที่ไม่มี context
    const reportButton = document.getElementById('reportProblemBtn');
    if (reportButton) {
        reportButton.addEventListener('click', event => {
            event.preventDefault();
            window.openReportModal(null, null, 'รายงานทั่วไป');
        });
    }
});
