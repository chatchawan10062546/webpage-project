// ====================================================
// 👤 profile.js : หน้าต่างโปรไฟล์และรายการของฉัน
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const profileButton = document.getElementById('profileOpenBtn');
    if (!profileButton) return;

    function getUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getUser();
        return user?.id || user?.user_id || user?.userId;
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    async function showProfile() {
        const userId = getUserId();
        if (!userId) return alert('กรุณาเข้าสู่ระบบก่อนดูโปรไฟล์');

        try {
            const [profileData, itemsData, statsData, reviewsData] = await Promise.all([
                requestJson(`http://localhost:3000/api/profile?user_id=${userId}`),
                requestJson(`http://localhost:3000/api/profile/items?user_id=${userId}`),
                requestJson(`http://localhost:3000/api/users/${userId}/profile-stats`),
                requestJson(`http://localhost:3000/api/users/${userId}/reviews`)
            ]);
            const profile = profileData.profile;
            const stats = statsData.profile || {};
            const reviews = reviewsData.reviews || [];

            const userXP = stats.xp || 0;
            const userLevel = stats.level || 1;
            const xpInCurrentLevel = userXP % 100; // ทุกๆ 100 XP ได้ 1 เลเวล

            const items = itemsData.items.map(item => `
                <div class="profile-item-row">
                    <img src="${escapeHtml(item.image_url || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80')}" alt="">
                    <div class="flex-grow-1 min-width-0">
                        <div class="fw-bold text-truncate">
                            ${escapeHtml(item.title)}
                            ${!item.is_approved ? '<span class="badge text-bg-warning ms-2">รอตรวจสอบ</span>' : ''}
                        </div>
                        <small class="text-muted">${escapeHtml(item.category)} · ${escapeHtml(item.status)}</small>
                    </div>
                    <span class="fw-bold text-success">${item.item_type === 'free' ? 'ฟรี' : `฿${Number(item.price).toLocaleString()}`}</span>
                </div>
            `).join('') || '<p class="text-muted text-center mb-0">ยังไม่มีรายการที่ประกาศ</p>';

            const reviewsHTML = reviews.length ? reviews.map(r => `
                <div class="p-3 bg-light rounded-3 mb-2 border">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="fw-bold text-dark"><i class="bi bi-person-circle text-primary me-1"></i>${escapeHtml(r.reviewer_name)}</span>
                        <span class="text-warning fw-bold">${'⭐'.repeat(r.rating)}</span>
                    </div>
                    <p class="small text-secondary mb-1">${escapeHtml(r.comment || 'ไม่ได้เขียนความคิดเห็น')}</p>
                    <small class="text-muted" style="font-size: 0.75rem;">${new Date(r.created_at).toLocaleDateString('th-TH')}</small>
                </div>
            `).join('') : '<p class="text-muted text-center mb-0 small py-3">ยังไม่มีรีวิวเข้ามา</p>';

            document.getElementById('profileModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="profileModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content profile-modal border-0 shadow-lg rounded-4">
                            <div class="modal-header bg-success text-white">
                                <h5 class="modal-title fw-bold">👤 โปรไฟล์ของฉัน</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4" style="max-height: 80vh; overflow-y: auto;">
                                
                                <!-- 🏆 แผงแสดง Level & XP -->
                                <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 text-white" style="background: linear-gradient(135deg, #6f42c1 0%, #a100ff 100%);">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                            <span class="badge bg-warning text-dark fs-6 rounded-pill px-3 mb-1">LEVEL ${userLevel}</span>
                                            <h4 class="fw-bold mb-0">${escapeHtml(profile.name)}</h4>
                                        </div>
                                        <div class="text-end">
                                            <span class="fs-4 fw-bold">⭐ ${stats.avg_rating || '0.0'}</span>
                                            <div class="small opacity-75">${stats.review_count || 0} รีวิว</div>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <div class="d-flex justify-content-between small mb-1 opacity-90">
                                            <span>ระดับสะสมประสบการณ์ (XP)</span>
                                            <span class="fw-bold">${userXP} XP (${xpInCurrentLevel}/100 XP)</span>
                                        </div>
                                        <div class="progress" style="height: 10px; background-color: rgba(255,255,255,0.3);">
                                            <div class="progress-bar bg-warning" role="progressbar" style="width: ${xpInCurrentLevel}%;"></div>
                                        </div>
                                    </div>
                                </div>

                                <form id="profileForm" class="profile-form mb-4 border p-3 rounded-4 bg-light">
                                    <div class="profile-form-heading fw-bold mb-3"><i class="bi bi-person-lines-fill me-2 text-success"></i>ข้อมูลส่วนตัว</div>
                                    <div class="row g-3">
                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profileName">ชื่อ</label><input id="profileName" class="form-control" value="${escapeHtml(profile.name)}" required></div>
                                        <div class="col-md-6"><label class="form-label fw-semibold" for="profilePhone">เบอร์โทรศัพท์</label><input id="profilePhone" class="form-control" value="${escapeHtml(profile.phone)}"></div>
                                    </div>
                                    <div class="small text-muted mt-2">อีเมล: ${escapeHtml(profile.email)}</div>
                                    <button class="btn btn-success mt-3 rounded-pill px-4" type="submit">บันทึกข้อมูล</button>
                                </form>

                                <div class="mb-4">
                                    <div class="profile-list-heading fw-bold mb-2"><i class="bi bi-box-seam text-success me-2"></i>รายการที่ฉันประกาศ <span class="badge text-bg-success rounded-pill">${itemsData.items.length}</span></div>
                                    <div class="profile-items-list border p-3 rounded-4 bg-light">${items}</div>
                                </div>

                                <div>
                                    <div class="fw-bold mb-2"><i class="bi bi-star-fill text-warning me-2"></i>ความคิดเห็นและรีวิวจากผู้ใช้อื่น <span class="badge text-bg-secondary rounded-pill">${reviews.length}</span></div>
                                    <div class="reviews-list border p-3 rounded-4 bg-light">${reviewsHTML}</div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            `);

            const modalElement = document.getElementById('profileModal');
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });

            document.getElementById('profileForm').addEventListener('submit', async event => {
                event.preventDefault();
                try {
                    const updatedName = document.getElementById('profileName').value;
                    const updatedPhone = document.getElementById('profilePhone').value;
                    const result = await requestJson('http://localhost:3000/api/profile', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId, name: updatedName, phone: updatedPhone })
                    });
                    const storedUser = getUser();
                    localStorage.setItem('user', JSON.stringify({ ...storedUser, name: result.profile.name, phone: result.profile.phone }));
                    alert('บันทึกโปรไฟล์สำเร็จ');
                    location.reload();
                } catch (error) {
                    alert('บันทึกโปรไฟล์ไม่สำเร็จ: ' + error.message);
                }
            });
        } catch (error) {
            alert('เปิดโปรไฟล์ไม่สำเร็จ: ' + error.message);
        }
    }

    profileButton.addEventListener('click', event => {
        event.preventDefault();
        showProfile();
    });
});
