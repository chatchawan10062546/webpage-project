// ====================================================
// 🛠️ itemManagement.js : แก้ไขและลบรายการของตัวเอง
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');
    if (!itemGrid) return;
    let editingItem = null;

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getCurrentUser();
        return user?.id || user?.user_id || user?.userId;
    }

    function getCurrentCoordinates() {
        return getUserCoordinates();
    }

    function getItemData(card) {
        const detailButton = card.querySelector('.request-btn');
        const imgEl = card.querySelector('.item-card-img');
        return {
            itemId: card.dataset.itemId,
            latitude: card.dataset.latitude || '',
            longitude: card.dataset.longitude || '',
            title: detailButton?.dataset.title || '',
            category: detailButton?.dataset.category || '',
            itemType: detailButton?.dataset.type || 'free',
            price: detailButton?.dataset.price || '0',
            deposit: detailButton?.dataset.deposit || '0',
            quantity: detailButton?.dataset.quantity || '1',
            location: detailButton?.dataset.location || '',
            description: detailButton?.dataset.description || '',
            imageUrl: imgEl?.getAttribute('src') || ''
        };
    }

    function showEditModal(item) {
        editingItem = item;
        const oldModal = document.getElementById('editItemModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="editItemModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title fw-bold"><i class="bi bi-pencil-square me-2"></i>แก้ไขรายการ</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form id="editItemForm">
                            <div class="modal-body p-4">
                                <input type="hidden" id="editItemId" value="${item.itemId}">
                                <div class="mb-3">
                                    <label for="editTitle" class="form-label fw-bold">ชื่อรายการ <span class="text-danger">*</span></label>
                                    <input id="editTitle" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editCategory" class="form-label fw-bold">หมวดหมู่ <span class="text-danger">*</span></label>
                                    <select id="editCategory" class="form-select" required>
                                        <option value="อาหาร">🥗 อาหาร</option>
                                        <option value="เสื้อผ้า">👕 เสื้อผ้า</option>
                                        <option value="ของใช้">📦 ของใช้</option>
                                        <option value="อื่นๆ">✨ อื่นๆ</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editType" class="form-label fw-bold">ประเภท <span class="text-danger">*</span></label>
                                    <select id="editType" class="form-select">
                                        <option value="free">🎁 แจกฟรี</option>
                                        <option value="sell">💰 ซื้อขาย</option>
                                        <option value="rent">🤝 ให้เช่า</option>
                                    </select>
                                </div>
                                <div class="mb-3 d-none" id="editPriceContainer">
                                    <label for="editPrice" class="form-label fw-bold" id="editPriceLabel">ราคา (บาท)</label>
                                    <input id="editPrice" class="form-control" type="number" min="0" placeholder="0">
                                </div>
                                <div class="mb-3 d-none" id="editDepositContainer">
                                    <label for="editDeposit" class="form-label fw-bold">เงินมัดจำ (บาท) <span class="text-muted fw-normal small">(เฉพาะให้เช่า)</span></label>
                                    <input id="editDeposit" class="form-control" type="number" min="0" placeholder="0">
                                </div>
                                <div class="mb-3">
                                    <label for="editQuantity" class="form-label fw-bold">จำนวนชิ้น</label>
                                    <input id="editQuantity" class="form-control" type="number" min="1">
                                </div>
                                <div class="mb-3">
                                    <label for="editLocation" class="form-label fw-bold">สถานที่ / ชุมชน</label>
                                    <input id="editLocation" class="form-control">
                                </div>
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label fw-bold">รายละเอียด</label>
                                    <textarea id="editDescription" class="form-control" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="editImage" class="form-label fw-bold">รูปภาพรายการ</label>
                                    <div id="editImagePreviewBox" class="mb-2 p-2 bg-light rounded-3 border d-flex align-items-center gap-3">
                                        <img id="editImagePreview" src="${item.imageUrl || '/assets/pansuk_icon.jpg'}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" class="border shadow-sm">
                                        <div>
                                            <strong class="d-block small text-dark" id="editImagePreviewLabel">รูปภาพปัจจุบัน</strong>
                                            <small class="text-muted" style="font-size: 0.75rem;">เลือกไฟล์ใหม่ด้านล่างหากต้องการเปลี่ยนรูป</small>
                                        </div>
                                    </div>
                                    <input id="editImage" class="form-control" type="file" accept="image/*">
                                </div>
                            </div>
                            <div class="modal-footer bg-light">
                                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">ยกเลิก</button>
                                <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" id="btnSubmitEditItem">บันทึกการแก้ไข</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `);

        document.getElementById('editTitle').value = item.title || '';
        document.getElementById('editCategory').value = item.category || 'อื่นๆ';
        document.getElementById('editType').value = item.itemType || 'free';
        document.getElementById('editPrice').value = item.price || 0;
        document.getElementById('editDeposit').value = item.deposit || 0;
        document.getElementById('editQuantity').value = item.quantity || 1;
        document.getElementById('editLocation').value = item.location || '';
        document.getElementById('editDescription').value = item.description || '';

        const editTypeEl = document.getElementById('editType');
        const priceContainer = document.getElementById('editPriceContainer');
        const depositContainer = document.getElementById('editDepositContainer');
        const priceLabel = document.getElementById('editPriceLabel');

        function updateTypeInputs(typeVal) {
            if (typeVal === 'free') {
                if (priceContainer) priceContainer.classList.add('d-none');
                if (depositContainer) depositContainer.classList.add('d-none');
            } else if (typeVal === 'rent') {
                if (priceContainer) priceContainer.classList.remove('d-none');
                if (depositContainer) depositContainer.classList.remove('d-none');
                if (priceLabel) priceLabel.textContent = 'ค่าเช่า (บาท / วัน)';
            } else {
                if (priceContainer) priceContainer.classList.remove('d-none');
                if (depositContainer) depositContainer.classList.add('d-none');
                if (priceLabel) priceLabel.textContent = 'ราคาขาย (บาท)';
            }
        }

        updateTypeInputs(item.itemType || 'free');

        if (editTypeEl) {
            editTypeEl.addEventListener('change', (e) => {
                updateTypeInputs(e.target.value);
            });
        }

        const editImgInput = document.getElementById('editImage');
        if (editImgInput) {
            editImgInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        const prev = document.getElementById('editImagePreview');
                        const prevLbl = document.getElementById('editImagePreviewLabel');
                        if (prev) prev.src = re.target.result;
                        if (prevLbl) prevLbl.textContent = 'รูปภาพใหม่ที่จะเปลี่ยน (ตัวอย่าง)';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }

        const modalElement = document.getElementById('editItemModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
    }
    window.showEditModal = showEditModal;

    async function sendRequest(url, options = {}) {
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const headers = new Headers(options.headers || {});
        if (token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        const response = await fetch(url, { ...options, headers });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    itemGrid.addEventListener('click', (event) => {
        const editButton = event.target.closest('.item-edit-btn');
        const deleteButton = event.target.closest('.item-delete-btn');
        const toggleStatusBtn = event.target.closest('.item-toggle-status-btn');
        const card = event.target.closest('.item-element');
        if (!card) return;

        if (editButton) {
            editingItem = getItemData(card);
            showEditModal(editingItem);
        }

        if (deleteButton) {
            const itemId = card.dataset.itemId;
            if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
            sendRequest(`/api/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: getUserId() })
            }).then(() => {
                card.remove();
                if (typeof window.loadItemsFromDB === 'function') {
                    window.loadItemsFromDB();
                }
            })
                .catch(error => alert('ไม่สามารถลบรายการได้: ' + error.message));
        }

        if (toggleStatusBtn) {
            const itemId = card.dataset.itemId;
            sendRequest(`/api/items/${itemId}/toggle-status`, {
                method: 'PATCH'
            }).then(res => {
                alert(res.message);
                if (res.status === 'completed') {
                    // หากกดหมดแล้ว ให้นำการ์ดออกจากหน้าเว็บทันที โดยข้อมูลยังคงเก็บรักษาไว้ในฐานข้อมูลครบถ้วน
                    card.style.transition = 'all 0.35s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.85)';
                    setTimeout(() => {
                        card.remove();
                        if (typeof window.refreshMyItemsCount === 'function') window.refreshMyItemsCount();
                        if (typeof window.loadItemsFromDB === 'function') window.loadItemsFromDB();
                    }, 350);
                } else {
                    if (typeof window.loadItemsFromDB === 'function') {
                        window.loadItemsFromDB();
                    } else {
                        location.reload();
                    }
                }
            }).catch(error => alert('ไม่สามารถเปลี่ยนสถานะได้: ' + error.message));
        }
    });

    document.addEventListener('submit', async (event) => {
        if (event.target.id !== 'editItemForm') return;
        event.preventDefault();

        const submitBtn = document.getElementById('btnSubmitEditItem');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
        }

        try {
            const formData = new FormData();
            formData.append('user_id', getUserId());
            formData.append('title', document.getElementById('editTitle').value);
            formData.append('category', document.getElementById('editCategory').value);
            formData.append('item_type', document.getElementById('editType').value);
            formData.append('price', document.getElementById('editPrice').value || '0');
            formData.append('deposit', document.getElementById('editDeposit')?.value || '0');
            formData.append('quantity', document.getElementById('editQuantity').value || '1');
            formData.append('location', document.getElementById('editLocation').value);
            formData.append('description', document.getElementById('editDescription').value);

            const image = document.getElementById('editImage').files[0];
            if (image) formData.append('image', image);

            let latitude = editingItem?.latitude || '';
            let longitude = editingItem?.longitude || '';
            if (!latitude || !longitude) {
                try {
                    const coordinates = await getCurrentCoordinates();
                    latitude = coordinates.latitude;
                    longitude = coordinates.longitude;
                } catch (error) {
                    console.warn('Coordinates fallback:', error.message);
                }
            }
            formData.append('latitude', latitude);
            formData.append('longitude', longitude);

            const itemId = document.getElementById('editItemId').value;
            await sendRequest(`/api/items/${itemId}`, { method: 'PUT', body: formData });
            
            alert('🎉 บันทึกการแก้ไขเรียบร้อยแล้ว!\nรายการของคุณจะถูกส่งให้แอดมินตรวจสอบความถูกต้องอีกครั้งก่อนแสดงผลบนหน้าเว็บครับ');
            location.reload();
        } catch (error) {
            alert('ไม่สามารถแก้ไขรายการได้: ' + error.message);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'บันทึกการแก้ไข';
            }
        }
    });
});
