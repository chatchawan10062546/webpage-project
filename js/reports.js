// ====================================================
// 🚩 reports.js : ฟอร์มแจ้งปัญหาสำหรับผู้ใช้ที่ล็อกอิน
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const reportButton = document.getElementById('reportProblemBtn');
    if (!reportButton) return;

    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    async function openReportModal() {
        try {
            const data = await requestJson('http://localhost:3000/api/items');
            const options = data.items.map(item => `<option value="${item.item_id}">${item.title}</option>`).join('');

            document.getElementById('reportModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="reportModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content report-modal">
                            <div class="modal-header">
                                <h5 class="modal-title">แจ้งปัญหา</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <form id="reportForm">
                                <div class="modal-body p-4">
                                    <label class="form-label fw-bold" for="reportItem">สินค้าที่เกี่ยวข้อง</label>
                                    <select id="reportItem" class="form-select mb-3" required>
                                        <option value="" selected disabled>-- เลือกสินค้า --</option>
                                        ${options}
                                    </select>
                                    <label class="form-label fw-bold" for="reportReason">รายละเอียดปัญหา</label>
                                    <textarea id="reportReason" class="form-control" rows="5" maxlength="2000" placeholder="อธิบายปัญหาที่พบ" required></textarea>
                                    <div class="form-text">ข้อมูลนี้จะถูกส่งให้ทีมงานตรวจสอบ</div>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">ยกเลิก</button>
                                    <button type="submit" class="btn btn-danger">ส่งแจ้งปัญหา</button>
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
                try {
                    const result = await requestJson('http://localhost:3000/api/reports', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            item_id: document.getElementById('reportItem').value,
                            reason: document.getElementById('reportReason').value
                        })
                    });
                    modal.hide();
                    alert(result.message);
                } catch (error) {
                    submitButton.disabled = false;
                    alert('ส่งแจ้งปัญหาไม่สำเร็จ: ' + error.message);
                }
            });
        } catch (error) {
            alert('เปิดแบบฟอร์มแจ้งปัญหาไม่สำเร็จ: ' + error.message);
        }
    }

    reportButton.addEventListener('click', event => {
        event.preventDefault();
        openReportModal();
    });
});
