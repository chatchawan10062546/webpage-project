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
            const [profileData, itemsData] = await Promise.all([
                requestJson(`http://localhost:3000/api/profile?user_id=${userId}`),
                requestJson(`http://localhost:3000/api/profile/items?user_id=${userId}`)
            ]);
            const profile = profileData.profile;
            const items = itemsData.items.map(item => `
                <div class="profile-item-row">
                    <img src="${escapeHtml(item.image_url || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=160&auto=format&fit=crop&q=80')}" alt="">
                    <div class="flex-grow-1 min-width-0">
                        <div class="fw-bold text-truncate">${escapeHtml(item.title)}</div>
                        <small class="text-muted">${escapeHtml(item.category)} · ${escapeHtml(item.status)}</small>
                    </div>
                    <span class="fw-bold text-success">${item.item_type === 'free' ? 'ฟรี' : `฿${Number(item.price).toLocaleString()}`}</span>
                </div>
            `).join('') || '<p class="text-muted text-center mb-0">ยังไม่มีรายการที่ประกาศ</p>';

            document.getElementById('profileModal')?.remove();
            document.body.insertAdjacentHTML('beforeend', `
                <div class="modal fade" id="profileModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-centered modal-lg">
                        <div class="modal-content profile-modal">
                            <div class="modal-header">
                                <h5 class="modal-title">โปรไฟล์ของฉัน</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body p-4">
                                <form id="profileForm" class="profile-form mb-4">
                                    <div class="profile-form-heading"><i class="bi bi-person-circle"></i><span>ข้อมูลส่วนตัว</span></div>
                                    <div class="row g-3">
                                        <div class="col-md-6"><label class="form-label" for="profileName">ชื่อ</label><input id="profileName" class="form-control" value="${escapeHtml(profile.name)}" required></div>
                                        <div class="col-md-6"><label class="form-label" for="profilePhone">เบอร์โทรศัพท์</label><input id="profilePhone" class="form-control" value="${escapeHtml(profile.phone)}"></div>
                                    </div>
                                    <div class="small text-muted mt-2">อีเมล: ${escapeHtml(profile.email)}</div>
                                    <button class="btn btn-success mt-3" type="submit">บันทึกข้อมูล</button>
                                </form>
                                <div class="profile-list-heading"><i class="bi bi-box-seam"></i><span>รายการที่ฉันประกาศ</span><span class="badge text-bg-success">${itemsData.items.length}</span></div>
                                <div class="profile-items-list">${items}</div>
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
