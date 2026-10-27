// ====================================================
// 🛠️ itemManagement.js : แก้ไขและลบรายการของตัวเอง
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');
    if (!itemGrid) return;
    let editingItem = null;
    let selectedEditFiles = [];

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
        let parsedImages = [];
        try {
            if (detailButton?.dataset.images) {
                parsedImages = JSON.parse(detailButton.dataset.images);
            }
        } catch (e) {}
        if (!parsedImages.length && imgEl?.getAttribute('src')) {
            parsedImages = [imgEl.getAttribute('src')];
        }

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
            images: parsedImages
        };
    }

    // ฟังก์ชันย่อขนาดรูปภาพก่อนอัปโหลดเพื่อความรวดเร็วและประหยัดแบนด์วิดท์
    function compressImageFile(file, maxDimension = 1200, quality = 0.82) {
        return new Promise((resolve) => {
            if (!file || !file.type.startsWith('image/') || file.size <= 250 * 1024) {
                resolve(file);
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxDimension) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob && blob.size < file.size) {
                            const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                                type: 'image/jpeg',
                                lastModified: Date.now()
                            });
                            resolve(compressed);
                        } else {
                            resolve(file);
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    function renderEditImagePreviews() {
        const container = document.getElementById('editImagePreviewContainer');
        const badge = document.getElementById('editImageCountBadge');
        if (!container) return;

        container.innerHTML = '';
        if (badge) {
            badge.textContent = `${selectedEditFiles.length}/5 รูปใหม่`;
            badge.className = selectedEditFiles.length > 0 ? 'badge bg-primary rounded-pill' : 'badge bg-secondary rounded-pill';
        }

        selectedEditFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);
            const thumb = document.createElement('div');
            thumb.className = 'position-relative d-inline-block rounded-3 overflow-hidden shadow-sm border';
            thumb.style.width = '75px';
            thumb.style.height = '75px';
            thumb.innerHTML = `
                <img src="${url}" class="w-100 h-100 object-fit-cover" alt="รูปที่ ${index + 1}">
                ${index === 0 ? '<span class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center py-0 small" style="font-size: 0.65rem;">หน้าปก</span>' : ''}
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle remove-edit-img-btn" data-index="${index}" style="width: 20px; height: 20px; font-size: 0.65rem; margin: 2px;">
                    <i class="bi bi-x"></i>
                </button>
            `;
            container.appendChild(thumb);
        });
    }

    function showEditModal(item) {
        editingItem = item;
        selectedEditFiles = [];
        const oldModal = document.getElementById('editItemModal');
        if (oldModal) oldModal.remove();

        const existingImagesHtml = (item.images && item.images.length > 0)
            ? item.images.map((img, idx) => `
                <div class="position-relative d-inline-block rounded-3 overflow-hidden shadow-sm border" style="width: 65px; height: 65px;">
                    <img src="${img}" class="w-100 h-100 object-fit-cover" alt="รูปที่ ${idx + 1}">
                    ${idx === 0 ? '<span class="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white text-center py-0 small" style="font-size: 0.65rem;">หน้าปก</span>' : ''}
                </div>
            `).join('')
            : '<span class="text-muted small">ไม่มีรูปภาพเดิม</span>';

        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="editItemModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content border-0 shadow-lg rounded-4">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title fw-bold"><i class="bi bi-pencil-square me-2"></i>แก้ไขรายการสิ่งของ</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form id="editItemForm">
                            <div class="modal-body p-4">
                                <input type="hidden" id="editItemId" value="${item.itemId}">
                                <div class="mb-3">
                                    <label for="editTitle" class="form-label fw-bold">ชื่อรายการ <span class="text-danger">*</span></label>
                                    <input id="editTitle" class="form-control form-control-lg" required>
                                </div>
                                <div class="row g-3 mb-3">
                                    <div class="col-md-6">
                                        <label for="editCategory" class="form-label fw-bold">หมวดหมู่ <span class="text-danger">*</span></label>
                                        <select id="editCategory" class="form-select" required>
                                            <option value="อาหาร">🥗 อาหาร</option>
                                            <option value="เสื้อผ้า">👕 เสื้อผ้า</option>
                                            <option value="ของใช้">📦 ของใช้</option>
                                            <option value="อื่นๆ">✨ อื่นๆ</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label for="editType" class="form-label fw-bold">ประเภท <span class="text-danger">*</span></label>
                                        <select id="editType" class="form-select">
                                            <option value="free">🎁 แจกฟรี</option>
                                            <option value="sell">💰 ซื้อขาย</option>
                                            <option value="rent">🤝 ให้เช่า</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row g-3 mb-3">
                                    <div class="col-md-6 d-none" id="editPriceContainer">
                                        <label for="editPrice" class="form-label fw-bold" id="editPriceLabel">ราคา (บาท)</label>
                                        <input id="editPrice" class="form-control" type="number" min="0" placeholder="0">
                                    </div>
                                    <div class="col-md-6 d-none" id="editDepositContainer">
                                        <label for="editDeposit" class="form-label fw-bold">เงินมัดจำประกันสินค้า (บาท) <span class="text-muted fw-normal small">(เฉพาะให้เช่า)</span></label>
                                        <input id="editDeposit" class="form-control" type="number" min="0" placeholder="0">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="editQuantity" class="form-label fw-bold">จำนวนชิ้นที่คงเหลือ</label>
                                        <input id="editQuantity" class="form-control" type="number" min="1">
                                    </div>
                                    <div class="col-md-6">
                                        <label for="editLocation" class="form-label fw-bold">สถานที่ / ชุมชนที่นัดรับ</label>
                                        <input id="editLocation" class="form-control">
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="editDescription" class="form-label fw-bold">รายละเอียดสิ่งของ</label>
                                    <textarea id="editDescription" class="form-control" rows="3"></textarea>
                                </div>

                                <div class="mb-3">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <label class="form-label fw-bold mb-0">📸 รูปภาพสิ่งของ (เปลี่ยนใหม่ได้สูงสุด 5 รูป)</label>
                                        <span class="badge bg-secondary rounded-pill" id="editImageCountBadge">0/5 รูปใหม่</span>
                                    </div>
                                    
                                    <!-- รูปปัจจุบัน -->
                                    <div class="mb-2 p-2 bg-light rounded-3 border">
                                        <small class="text-muted d-block fw-bold mb-1"><i class="bi bi-card-image me-1"></i>รูปภาพปัจจุบันในระบบ:</small>
                                        <div class="d-flex flex-wrap gap-2">
                                            ${existingImagesHtml}
                                        </div>
                                        <small class="text-secondary d-block mt-1" style="font-size: 0.75rem;">* หากท่านเลือกรูปภาพใหม่ด้านล่าง ระบบจะเปลี่ยนไปใช้รูปชุดใหม่ทั้งหมด (สูงสุด 5 รูป)</small>
                                    </div>

                                    <!-- กล่องเลือกรูปใหม่ -->
                                    <div class="border rounded-4 p-3 bg-light text-center" id="editImageArea">
                                        <div id="editImagePreviewContainer" class="d-flex flex-wrap gap-2 mb-2 justify-content-start"></div>
                                        <input class="d-none" type="file" id="editImageFiles" accept="image/jpeg, image/png, image/webp" multiple>
                                        <button type="button" class="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold" id="triggerEditImageUploadBtn">
                                            <i class="bi bi-images me-2"></i>เลือกรูปภาพใหม่ (เลือกได้ทีละรูปหรือพร้อมกัน สูงสุด 5 รูป)
                                        </button>
                                        <div class="form-text text-muted mt-2" style="font-size: 0.8rem;">
                                            รองรับ JPG, PNG, WEBP สูงสุดไม่เกิน 5 รูป (รูปแรกสุดจะเป็นรูปหน้าปก)
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer bg-light p-3">
                                <button type="button" class="btn btn-secondary rounded-pill px-4" data-bs-dismiss="modal">ยกเลิก</button>
                                <button type="submit" class="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" id="btnSubmitEditItem">
                                    <i class="bi bi-check2-circle me-1"></i>บันทึกการแก้ไข
                                </button>
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

        // ปุ่ม Trigger ให้เปิด File Picker
        const triggerBtn = document.getElementById('triggerEditImageUploadBtn');
        const fileInput = document.getElementById('editImageFiles');
        if (triggerBtn && fileInput) {
            triggerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.value = '';
                fileInput.click();
            });

            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                for (const file of files) {
                    if (selectedEditFiles.length >= 5) {
                        alert('คุณสามารถเลือกรูปภาพได้สูงสุดไม่เกิน 5 รูปครับ');
                        break;
                    }
                    if (!file.type.startsWith('image/')) {
                        alert('กรุณาเลือกเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)');
                        continue;
                    }
                    const compressed = await compressImageFile(file, 1200, 0.82);
                    selectedEditFiles.push(compressed);
                }
                renderEditImagePreviews();
            });
        }

        const modalElement = document.getElementById('editItemModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        modalElement.addEventListener('hidden.bs.modal', () => {
            selectedEditFiles = [];
            modalElement.remove();
        }, { once: true });
    }
    window.showEditModal = showEditModal;

    // ปุ่มลบรูปแต่ละรูปในกล่องเลือกรูปใหม่
    document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-edit-img-btn');
        if (removeBtn) {
            e.preventDefault();
            const idx = parseInt(removeBtn.dataset.index, 10);
            if (!isNaN(idx) && idx >= 0 && idx < selectedEditFiles.length) {
                selectedEditFiles.splice(idx, 1);
                renderEditImagePreviews();
            }
        }
    });

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

            // แนบรูปภาพใหม่ทั้งหมด (สูงสุด 5 รูป)
            if (selectedEditFiles.length > 0) {
                selectedEditFiles.forEach(file => {
                    formData.append('images', file);
                });
                formData.append('image', selectedEditFiles[0]);
            }

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
                submitBtn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>บันทึกการแก้ไข';
            }
        }
    });
});
