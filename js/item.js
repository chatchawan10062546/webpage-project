// ====================================================
// 📦 js/item.js : เพิ่มประกาศ + Modal แนวตั้งทรงใหญ่ + Gallery รูปภาพ (เชื่อมต่อ Database)
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');

    // ----------------------------------------------------
    // 1. ดึงข้อมูลรายการสิ่งของทั้งหมดจากฐานข้อมูล (Backend Database)
    // ----------------------------------------------------
    async function loadItemsFromDB() {
        try {
            const response = await fetch('http://localhost:3000/api/items');
            const data = await response.json();

            if (data.success && itemGrid) {
                itemGrid.innerHTML = ''; // ล้างข้อมูลเก่าออกก่อนแสดงผลใหม่

                if (data.items.length === 0) {
                    itemGrid.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <p class="text-muted fs-5">ยังไม่มีรายการสิ่งของในขณะนี้</p>
                        </div>
                    `;
                    return;
                }

                // วนลูปเรนเดอร์การ์ดสิ่งของ
                data.items.forEach(item => renderItemCard(item, false));
            }
        } catch (err) {
            console.error('Error loading items from database:', err);
        }
    }

    // ----------------------------------------------------
    // 2. ฟังก์ชันแสดงผลการ์ดสิ่งของ (Item Card)
    // ----------------------------------------------------
    function renderItemCard(item, prepend = true) {
        if (!itemGrid) return;

        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
        const itemId = item.item_id || item.id;
        const itemOwnerId = item.user_id || item.userId;
        const isOwner = currentUserId && String(currentUserId) === String(itemOwnerId);

        // จัดการเรื่องภาพ (แปลง URL หรือใช้ภาพตั้งต้น)
        let imagesArray = [];
        if (item.image_url) {
            imagesArray = [item.image_url];
        } else if (Array.isArray(item.images) && item.images.length > 0) {
            imagesArray = item.images;
        } else {
            imagesArray = ['https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80'];
        }

        const itemType = item.item_type || item.itemType || 'free';
        const price = item.price || 0;

        const typeBadge = itemType === 'sell'
            ? '<span class="badge bg-primary me-1">ขาย</span>'
            : itemType === 'rent'
                ? '<span class="badge bg-warning text-dark me-1">ให้เช่า</span>'
                : '<span class="badge bg-success me-1">แจกฟรี</span>';

        const priceTagText = itemType === 'sell'
            ? `฿${Number(price).toLocaleString()}`
            : itemType === 'rent'
                ? `฿${Number(price).toLocaleString()}/วัน`
                : 'ฟรี';

        const imagesJson = JSON.stringify(imagesArray).replace(/"/g, '&quot;');
        const ownerControls = isOwner ? `
            <div class="item-owner-controls mt-3 pt-3 border-top d-flex gap-2" data-item-id="${itemId}">
                <button class="btn btn-outline-primary btn-sm flex-grow-1 item-edit-btn" type="button">แก้ไข</button>
                <button class="btn btn-outline-danger btn-sm flex-grow-1 item-delete-btn" type="button">ลบ</button>
                <button class="btn btn-outline-success btn-sm flex-grow-1 item-requests-btn" type="button">คำขอ</button>
                <select class="form-select form-select-sm item-status-select" aria-label="สถานะรายการ">
                    <option value="available" ${item.status === 'available' ? 'selected' : ''}>พร้อมใช้งาน</option>
                    <option value="reserved" ${item.status === 'reserved' ? 'selected' : ''}>จองแล้ว</option>
                    <option value="completed" ${item.status === 'completed' ? 'selected' : ''}>เสร็จสิ้น</option>
                </select>
            </div>
        ` : '';

        const newCardHTML = `
            <div class="col-md-4 col-sm-6 item-element" data-item-id="${itemId}" data-category="${item.category}" data-title="${item.title}">
                <div class="card item-card h-100 position-relative shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="position-absolute top-0 start-0 p-2 z-2">
                        ${typeBadge}
                        <span class="badge bg-dark bg-opacity-75">${item.category}</span>
                    </div>
                    <img src="${imagesArray[0]}" class="card-img-top" alt="${item.title}" style="height: 220px; object-fit: cover;">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <h5 class="card-title fw-bold mb-0">${item.title}</h5>
                            <span class="fw-bold text-success fs-5">${priceTagText}</span>
                        </div>
                        <p class="card-text text-muted small mb-2">📍 ${item.location || 'ไม่ระบุสถานที่'}</p>
                        <p class="card-text text-secondary text-truncate small">${item.description || ''}</p>
                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <span class="small text-muted">โพสต์เมื่อ ${new Date(item.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                            <button class="btn btn-outline-success btn-sm px-3 rounded-pill fw-bold request-btn"
                                data-title="${item.title}"
                                data-category="${item.category}"
                                data-type="${itemType}"
                                data-price="${price}"
                                data-location="${item.location || ''}"
                                data-description="${item.description || ''}"
                                data-images="${imagesJson}">
                                ดูรายละเอียด
                            </button>
                        </div>
                        ${ownerControls}
                    </div>
                </div>
            </div>
        `;

        if (prepend) itemGrid.insertAdjacentHTML('afterbegin', newCardHTML);
        else itemGrid.insertAdjacentHTML('beforeend', newCardHTML);
    }

    // เรียกดึงข้อมูลจาก Database เมื่อโหลดหน้าเว็บ
    loadItemsFromDB();

    // ----------------------------------------------------
    // 3. ดักจับการลงประกาศใหม่ (บันทึกลง Database ผ่าน API)
    // ----------------------------------------------------
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'postItemForm') {
            e.preventDefault();

            // 📌 [แก้ไข] ตรวจสอบผู้ใช้ผ่าน LocalStorage แบบยืดหยุ่น (รองรับ id / user_id / userId)
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || user?.user_id || user?.userId;

            if (!user || !userId) {
                alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำการลงประกาศสิ่งของ');
                return;
            }

            const itemType = document.querySelector('input[name="itemType"]:checked')?.value || 'free';
            const price = document.getElementById('postPrice')?.value || '0';
            const title = document.getElementById('postTitle')?.value || 'รายการใหม่';
            const category = document.getElementById('postCategory')?.value || 'อื่นๆ';
            const location = document.getElementById('postLocation')?.value || 'ละแวกใกล้เคียง';
            const description = document.getElementById('postDescription')?.value || '';
            const imageInput = document.getElementById('postImageFile');

            // จัดเตรียมข้อมูลส่งแบบ FormData เพื่อรองรับการอัปโหลดไฟล์
            const formData = new FormData();
            formData.append('user_id', userId); // 📌 ส่ง userId ที่เช็กผ่านแน่ๆ ไปยัง Backend
            formData.append('title', title);
            formData.append('category', category);
            formData.append('item_type', itemType);
            formData.append('price', price);
            formData.append('location', location);
            formData.append('description', description);

            if (imageInput && imageInput.files && imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            try {
                const response = await fetch('http://localhost:3000/api/items', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    alert('🎉 ลงประกาศและบันทึกข้อมูลสำเร็จเรียบร้อยแล้ว!');
                    
                    e.target.reset();

                    const postModalEl = document.getElementById('postItemModal');
                    if (postModalEl) {
                        (bootstrap.Modal.getInstance(postModalEl) || new bootstrap.Modal(postModalEl)).hide();
                    }

                    // โหลดรายการสิ่งของใหม่ทั้งหมดจาก Database
                    loadItemsFromDB();
                } else {
                    alert('❌ ไม่สามารถบันทึกข้อมูลได้: ' + data.message);
                }
            } catch (err) {
                console.error('Error submitting item:', err);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            }
        }
    });

    // ----------------------------------------------------
    // 4. ดักจับการกดปุ่ม "ดูรายละเอียด"
    // ----------------------------------------------------
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('request-btn')) {
            const btn = e.target;
            if (btn.closest('.hero-section') || btn.closest('.navbar')) return;

            const card = btn.closest('.card');
            const title = btn.dataset.title || card?.querySelector('.card-title')?.innerText || 'รายการสิ่งของ';
            const category = btn.dataset.category || 'ของใช้';
            const location = btn.dataset.location || card?.querySelector('.text-muted')?.innerText || 'ใกล้ตัวคุณ';
            const description = btn.dataset.description || card?.querySelector('.text-secondary')?.innerText || 'ไม่มีรายละเอียด';
            const price = btn.dataset.price || '0';

            let itemType = btn.dataset.type;
            if (!itemType && card) {
                const text = card.innerText;
                if (text.includes('ขาย') || text.includes('ซื้อ')) itemType = 'sell';
                else if (text.includes('เช่า')) itemType = 'rent';
                else itemType = 'free';
            }
            itemType = itemType || 'free';

            // จัดการรูปภาพหลายรูปสำหรับ Gallery
            let images = [];
            if (btn.dataset.images) {
                try { images = JSON.parse(btn.dataset.images); } catch (err) {}
            }
            if (!images || images.length === 0) {
                const singleImg = btn.dataset.image || card?.querySelector('img')?.src;
                if (singleImg) images.push(singleImg);
                else images.push('https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80');
            }

            showItemDetailModal({ itemId, title, category, itemType, price, location, description, images });
        }
    });

    // ----------------------------------------------------
    // 5. ฟังก์ชันสร้าง Modal ขนาดใหญ่ + Layout แนวตั้ง (รูปบน -> ข้อมูลกลาง -> ปุ่มล่าง)
    // ----------------------------------------------------
    function showItemDetailModal(item) {
        const oldModal = document.getElementById('itemDetailModal');
        if (oldModal) oldModal.remove();

        // สร้าง Thumbnails ถ้ามีหลายรูป
        let thumbnailsHTML = '';
        if (item.images.length > 1) {
            thumbnailsHTML = `<div class="d-flex gap-2 overflow-auto py-2 justify-content-center">`;
            item.images.forEach((imgSrc, idx) => {
                thumbnailsHTML += `
                    <img src="${imgSrc}" class="img-thumbnail thumbnail-btn ${idx === 0 ? 'border-success border-2' : ''}" 
                         style="width: 80px; height: 80px; object-fit: cover; cursor: pointer; border-radius: 12px;" 
                         data-target-src="${imgSrc}">
                `;
            });
            thumbnailsHTML += `</div>`;
        }

        // ปุ่มการทำรายการ
        let actionButtonsHTML = '';
        if (item.itemType === 'free') {
            actionButtonsHTML = `
                <button class="btn btn-success w-100 p-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        style="background-color: #198754;" data-action="free">
                    🎁 ยืนยันขอรับของฟรี
                    <div class="fs-6 opacity-75 fw-normal mt-1">นัดรับด้วยตนเอง หรือผ่านจุดฝากของชุมชน</div>
                </button>
            `;
        } else {
            const typeLabel = item.itemType === 'sell' ? `ซื้อขาย (฿${Number(item.price).toLocaleString()})` : `ให้เช่า (฿${Number(item.price).toLocaleString()}/วัน)`;
            actionButtonsHTML = `
                <button class="btn btn-primary w-100 p-3 rounded-4 mb-3 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        style="background-color: #0d6efd;" data-action="escrow">
                    🛡️ ดำเนินการ${typeLabel} ผ่านระบบคนกลาง
                    <div class="fs-6 opacity-75 fw-normal mt-1">ชำระเงินปลอดภัย พักเงินไว้ที่ระบบจนกว่าจะได้รับของเรียบร้อย</div>
                </button>
                <button class="btn btn-outline-secondary w-100 p-3 rounded-4 btn-select-option fs-5 fw-bold" data-action="direct">
                    🤝 นัดเจอตกลงโดยตรงกับผู้ประกาศ
                    <div class="fs-6 opacity-75 fw-normal mt-1">ติดต่อผู้ขาย ชำระเงินและรับมอบสินค้ากันเองโดยตรง</div>
                </button>
            `;
        }

        const detailModalHTML = `
            <div class="modal fade" id="itemDetailModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 720px;">
                    <div class="modal-content border-0 shadow-lg rounded-5 overflow-hidden p-3 p-md-4">
                        
                        <!-- Header -->
                        <div class="d-flex justify-content-between align-items-center pb-2">
                            <span class="badge bg-success px-3 py-2 rounded-pill fs-6 fw-bold">${item.category}</span>
                            <button type="button" class="btn-close fs-4" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body p-2 p-md-3">
                            
                            <!-- 🖼️ 1. รูปภาพสินค้าอยู่บนสุด -->
                            <div class="text-center mb-4 position-relative">
                                <img id="mainDetailImage" src="${item.images[0]}" 
                                     class="img-fluid rounded-4 shadow-sm w-100" 
                                     style="max-height: 420px; object-fit: contain; background-color: #f8f9fa;" alt="${item.title}">
                                ${thumbnailsHTML}
                            </div>

                            <!-- 📝 2. รายละเอียดสินค้าอยู่ตรงกลาง -->
                            <div class="bg-light p-4 rounded-4 mb-4 border">
                                <h2 class="fw-bold text-success mb-2">${item.title}</h2>
                                <p class="text-muted fs-6 mb-3">📍 ${item.location}</p>
                                <hr class="my-3">
                                <h5 class="fw-bold text-dark mb-2">รายละเอียดสินค้า:</h5>
                                <p class="text-secondary fs-5 mb-0" style="line-height: 1.6; white-space: pre-line;">${item.description}</p>
                            </div>

                            <!-- 🛒 3. รูปแบบการซื้อขายอยู่ล่างสุด -->
                            <div>
                                <h5 class="fw-bold text-dark mb-3">เลือกลักษณะการทำรายการ:</h5>
                                ${actionButtonsHTML}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailModalHTML);
        const detailModal = new bootstrap.Modal(document.getElementById('itemDetailModal'));
        detailModal.show();

        // คลิกเปลี่ยนรูปใน Gallery
        document.querySelectorAll('.thumbnail-btn').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                const newSrc = e.currentTarget.dataset.targetSrc;
                document.getElementById('mainDetailImage').src = newSrc;
                
                document.querySelectorAll('.thumbnail-btn').forEach(t => t.classList.remove('border-success', 'border-2'));
                e.currentTarget.classList.add('border-success', 'border-2');
            });
        });

        // ดักจับปุ่มกดเลือกการทำรายการ
        document.querySelectorAll('.btn-select-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                detailModal.hide();

                if (typeof window.submitItemRequest === 'function') {
                    window.submitItemRequest(item.itemId, action);
                }
            });
        });
    }
});