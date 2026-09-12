// ====================================================
// ⭐ reviews.js : ระบบ Modal ให้คะแนนรีวิวผู้ใช้
// ====================================================

window.openReviewModal = function(itemId = null, revieweeId = null, revieweeName = '', itemTitle = '') {
    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    if (!getUser()) {
        alert('กรุณาเข้าสู่ระบบก่อนทำการให้คะแนน');
        return;
    }

    if (!revieweeId) {
        alert('ไม่สามารถระบุผู้รับรีวิวได้');
        return;
    }

    async function requestJson(url, options = {}) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${localStorage.getItem('authToken')}` };
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    document.getElementById('reviewModal')?.remove();

    let selectedRating = 5;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade" id="reviewModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title fw-bold">⭐ ให้คะแนนและรีวิวผู้ใช้</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="reviewForm">
                        <div class="modal-body p-4 text-center">
                            <div class="mb-3">
                                <h6 class="fw-bold mb-1">ผู้รับคะแนน: <span class="text-primary">${revieweeName || 'ผู้ใช้'}</span></h6>
                                ${itemTitle ? `<small class="text-muted">รายการ: ${itemTitle}</small>` : ''}
                            </div>

                            <label class="form-label fw-bold d-block mb-2">ให้คะแนนความประทับใจ</label>
                            <div class="star-rating fs-2 mb-3" style="cursor: pointer; color: #ffc107;">
                                <i class="bi bi-star-fill star-icon" data-value="1"></i>
                                <i class="bi bi-star-fill star-icon" data-value="2"></i>
                                <i class="bi bi-star-fill star-icon" data-value="3"></i>
                                <i class="bi bi-star-fill star-icon" data-value="4"></i>
                                <i class="bi bi-star-fill star-icon" data-value="5"></i>
                            </div>

                            <div class="mb-3 text-start">
                                <label class="form-label fw-bold" for="reviewComment">ความคิดเห็น / คำชมเชย</label>
                                <textarea id="reviewComment" class="form-control" rows="3" placeholder="เช่น ส่งของไวมาก สภาพดีเยี่ยม ใจดีมากครับ..." required></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">ยกเลิก</button>
                            <button type="submit" class="btn btn-warning rounded-pill px-4 fw-bold text-dark">ส่งรีวิว ⭐</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    const modalElement = document.getElementById('reviewModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

    // คลิกเลือกจำนวนดาว
    const stars = modalElement.querySelectorAll('.star-icon');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            stars.forEach((s, idx) => {
                if (idx < selectedRating) {
                    s.classList.remove('bi-star');
                    s.classList.add('bi-star-fill');
                } else {
                    s.classList.remove('bi-star-fill');
                    s.classList.add('bi-star');
                }
            });
        });
    });

    document.getElementById('reviewForm').addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        try {
            const result = await requestJson('http://localhost:3000/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    item_id: itemId || null,
                    reviewee_id: revieweeId,
                    rating: selectedRating,
                    comment: document.getElementById('reviewComment').value
                })
            });
            modal.hide();
            alert(result.message);
        } catch (error) {
            submitButton.disabled = false;
            alert('ส่งรีวิวไม่สำเร็จ: ' + error.message);
        }
    });
};

