// ====================================================
// 🛠️ itemManagement.js : แก้ไข ลบ และเปลี่ยนสถานะรายการของตัวเอง
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');
    if (!itemGrid) return;

    function getCurrentUser() {
        return JSON.parse(localStorage.getItem('user') || 'null');
    }

    function getUserId() {
        const user = getCurrentUser();
        return user?.id || user?.user_id || user?.userId;
    }

    function getItemData(card) {
        const detailButton = card.querySelector('.request-btn');
        return {
            itemId: card.dataset.itemId,
            title: detailButton?.dataset.title || '',
            category: detailButton?.dataset.category || '',
            itemType: detailButton?.dataset.type || 'free',
            price: detailButton?.dataset.price || '0',
            location: detailButton?.dataset.location || '',
            description: detailButton?.dataset.description || ''
        };
    }

    function showEditModal(item) {
        const oldModal = document.getElementById('editItemModal');
        if (oldModal) oldModal.remove();

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="editItemModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title fw-bold">แก้ไขรายการ</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form id="editItemForm">
                            <div class="modal-body p-4">
                                <input type="hidden" id="editItemId" value="${item.itemId}">
                                <div class="mb-3">
                                    <label for="editTitle" class="form-label fw-bold">ชื่อรายการ</label>
                                    <input id="editTitle" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editCategory" class="form-label fw-bold">หมวดหมู่</label>
                                    <select id="editCategory" class="form-select" required>
                                        <option value="อาหาร">อาหาร</option>
                                        <option value="ของใช้">ของใช้</option>
                                        <option value="อื่นๆ">อื่นๆ</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editType" class="form-label fw-bold">ประเภท</label>
                                    <select id="editType" class="form-select">
                                        <option value="free">แจกฟรี</option>
                                        <option value="sell">ซื้อขาย</option>
                                        <option value="rent">ให้เช่า</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editPrice" class="form-label fw-bold">ราคา</label>
                                    <input id="editPrice" class="form-control" type="number" min="0">
                                </div>
                                <div class="mb-3">
                                    <label for="editLocation" class="form-label fw-bold">สถานที่ / ชุมชน</label>
                                    <input id="editLocation" class="form-control">
                                </div>
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label fw-bold">รายละเอียด</label>
                                    <textarea id="editDescription" class="form-control" rows="3"></textarea>
                                </div>
                                <div>
                                    <label for="editImage" class="form-label fw-bold">เปลี่ยนรูปภาพ (ถ้ามี)</label>
                                    <input id="editImage" class="form-control" type="file" accept="image/*">
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ยกเลิก</button>
                                <button type="submit" class="btn btn-primary">บันทึกการแก้ไข</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `);

        document.getElementById('editTitle').value = item.title;
        document.getElementById('editCategory').value = item.category;
        document.getElementById('editType').value = item.itemType;
        document.getElementById('editPrice').value = item.price;
        document.getElementById('editLocation').value = item.location;
        document.getElementById('editDescription').value = item.description;

        const modalElement = document.getElementById('editItemModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => modalElement.remove(), { once: true });
    }

    async function sendRequest(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'ดำเนินการไม่สำเร็จ');
        return data;
    }

    itemGrid.addEventListener('click', (event) => {
        const editButton = event.target.closest('.item-edit-btn');
        const deleteButton = event.target.closest('.item-delete-btn');
        const card = event.target.closest('.item-element');
        if (!card) return;

        if (editButton) {
            showEditModal(getItemData(card));
        }

        if (deleteButton) {
            const itemId = card.dataset.itemId;
            if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
            sendRequest(`http://localhost:3000/api/items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: getUserId() })
            }).then(() => card.remove())
                .catch(error => alert('ไม่สามารถลบรายการได้: ' + error.message));
        }
    });

    itemGrid.addEventListener('change', (event) => {
        if (!event.target.classList.contains('item-status-select')) return;
        const card = event.target.closest('.item-element');
        const itemId = card?.dataset.itemId;
        if (!itemId) return;

        sendRequest(`http://localhost:3000/api/items/${itemId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: event.target.value, user_id: getUserId() })
        }).catch(error => {
            alert('ไม่สามารถเปลี่ยนสถานะได้: ' + error.message);
            location.reload();
        });
    });

    document.addEventListener('submit', (event) => {
        if (event.target.id !== 'editItemForm') return;
        event.preventDefault();

        const formData = new FormData();
        formData.append('user_id', getUserId());
        formData.append('title', document.getElementById('editTitle').value);
        formData.append('category', document.getElementById('editCategory').value);
        formData.append('item_type', document.getElementById('editType').value);
        formData.append('price', document.getElementById('editPrice').value || '0');
        formData.append('location', document.getElementById('editLocation').value);
        formData.append('description', document.getElementById('editDescription').value);

        const image = document.getElementById('editImage').files[0];
        if (image) formData.append('image', image);

        const itemId = document.getElementById('editItemId').value;
        sendRequest(`http://localhost:3000/api/items/${itemId}`, { method: 'PUT', body: formData })
            .then(() => location.reload())
            .catch(error => alert('ไม่สามารถแก้ไขรายการได้: ' + error.message));
    });
});
