// ====================================================
// 📦 js/item.js : เพิ่มประกาศ + Modal แนวตั้งทรงใหญ่ + Gallery รูปภาพ (เชื่อมต่อ Database)
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const itemGrid = document.getElementById('itemGrid');

    function getCurrentCoordinates() {
        return getUserCoordinates();
    }

    // ----------------------------------------------------
    // 1. ดึงข้อมูลรายการสิ่งของทั้งหมดจากฐานข้อมูล (Backend Database)
    // ----------------------------------------------------
    
    let currentPage = 1;
    window.currentFeedMode = (window.location.hash === '#my-listings') ? 'my_listings' : 'all';

    window.loadItemsFromDB = async function loadItemsFromDB(append = false) {
        if (!append) currentPage = 1;

        try {
            const search = document.getElementById('searchInput')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            const type = document.getElementById('typeFilter')?.value || '';
            const min_price = document.getElementById('minPriceFilter')?.value || '';
            const max_price = document.getElementById('maxPriceFilter')?.value || '';
            const sort = document.getElementById('sortFilter')?.value || 'newest';
            const status_filter = document.getElementById('statusFilter')?.value || '';

            const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
            const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');

            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (category) queryParams.append('category', category);
            if (type) queryParams.append('type', type);
            if (min_price) queryParams.append('min_price', min_price);
            if (max_price) queryParams.append('max_price', max_price);
            if (sort) queryParams.append('sort', sort);

            let fetchUrl = '';
            let fetchOptions = {};

            if (window.currentFeedMode === 'my_listings') {
                if (!token || !currentUser) {
                    if (itemGrid) {
                        itemGrid.innerHTML = `
                            <div class="col-12 text-center py-5">
                                <i class="bi bi-person-lock fs-1 text-muted d-block mb-3"></i>
                                <p class="text-muted fs-5">กรุณาเข้าสู่ระบบเพื่อจัดการรายการที่ประกาศ</p>
                                <button class="btn btn-success rounded-pill px-4 fw-bold" data-bs-toggle="modal" data-bs-target="#loginModal">เข้าสู่ระบบ</button>
                            </div>
                        `;
                    }
                    const loadMoreContainer = document.getElementById('loadMoreContainer');
                    if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
                    return;
                }

                if (status_filter) queryParams.append('status_filter', status_filter);
                fetchUrl = `/api/items/mine?${queryParams.toString()}`;
                fetchOptions = {
                    headers: { 'Authorization': `Bearer ${token}` }
                };
            } else {
                // อ่านค่าจาก distance slider ใน main.js (ถ้ามี)
                const distanceSlider = document.getElementById('distanceSlider');
                const max_distance = distanceSlider ? distanceSlider.value : 'all';

                // ถ้าเลือกกรองระยะทาง ให้ส่งพิกัดผู้ใช้ไปด้วย
                if (max_distance !== 'all' && Number(max_distance) <= 50 && window.currentUserCoordinates) {
                    queryParams.append('max_distance', max_distance);
                    queryParams.append('lat', window.currentUserCoordinates.latitude);
                    queryParams.append('lng', window.currentUserCoordinates.longitude);
                }

                // แสดงสินค้าทั้งหมดร่วมกันในหน้าแรก ทั้งของตนเองและคนอื่น
                queryParams.append('page', currentPage);
                queryParams.append('limit', 24);

                fetchUrl = `/api/items?${queryParams.toString()}`;
            }

            const response = await fetch(fetchUrl, fetchOptions);
            const data = await response.json();

            if (data.success && itemGrid) {
                if (!append) itemGrid.innerHTML = '';

                // อัปเดตสถิติและตัวเลขนับจำนวนประกาศของผู้ใช้
                if (data.stats) {
                    const elTotal = document.getElementById('myStatsTotal');
                    const elAvail = document.getElementById('myStatsAvailable');
                    const elPend = document.getElementById('myStatsPending');
                    const elComp = document.getElementById('myStatsCompleted');
                    const countBadge = document.getElementById('myItemsCountBadge');

                    if (elTotal) elTotal.textContent = data.stats.total;
                    if (elAvail) elAvail.textContent = data.stats.available;
                    if (elPend) elPend.textContent = data.stats.pending;
                    if (elComp) elComp.textContent = data.stats.completed || 0;
                    if (countBadge) {
                        const activeCount = (Number(data.stats.available || 0) + Number(data.stats.pending || 0));
                        countBadge.textContent = activeCount;
                        countBadge.classList.toggle('d-none', activeCount === 0);
                    }
                }

                if (!data.items || data.items.length === 0) {
                    if (window.currentFeedMode === 'my_listings') {
                        itemGrid.innerHTML = `
                            <div class="col-12 text-center py-5">
                                <div class="bg-light d-inline-flex p-4 rounded-circle mb-3">
                                    <i class="bi bi-box-seam fs-1 text-success"></i>
                                </div>
                                <h5 class="fw-bold text-dark">ยังไม่มีรายการที่คุณลงประกาศ</h5>
                                <p class="text-muted">คุณสามารถเริ่มลงประกาศแบ่งปัน เช่า หรือขายสิ่งของของคุณได้ง่ายๆ</p>
                                <button class="btn btn-success rounded-pill px-4 fw-bold shadow-sm" data-bs-toggle="modal" data-bs-target="#addItemModal">
                                    <i class="bi bi-plus-circle me-1"></i> ลงประกาศสิ่งของ
                                </button>
                            </div>
                        `;
                    } else {
                        itemGrid.innerHTML = `
                            <div class="col-12 text-center py-5">
                                <p class="text-muted fs-5">ยังไม่มีรายการสิ่งของในขณะนี้</p>
                            </div>
                        `;
                    }
                    const loadMoreContainer = document.getElementById('loadMoreContainer');
                    if (loadMoreContainer) loadMoreContainer.classList.add('d-none');
                    return;
                }

                // วนลูปเรนเดอร์การ์ดสิ่งของ
                data.items.forEach(item => renderItemCard(item, false));
                if (window.currentUserCoordinates) {
                    updateAllItemDistances(window.currentUserCoordinates.latitude, window.currentUserCoordinates.longitude);
                }

                // ตรวจสอบปุ่มโหลดเพิ่มเติม (เฉพาะโหมด all ที่มี pagination)
                const loadMoreContainer = document.getElementById('loadMoreContainer');
                if (loadMoreContainer) {
                    if (window.currentFeedMode === 'all' && data.currentPage < data.totalPages) {
                        loadMoreContainer.classList.remove('d-none');
                    } else {
                        loadMoreContainer.classList.add('d-none');
                    }
                }
            }
        } catch (err) {
            console.error('Error loading items from database:', err);
        }
    };

    // ----------------------------------------------------
    // 2. ฟังก์ชันแสดงผลการ์ดสิ่งของ (Item Card)
    // ----------------------------------------------------
    function renderItemCard(item, prepend = true) {
        const safeTitle = (item.title || '').replace(/"/g, '&quot;');
        const safeDescription = (item.description || '').replace(/"/g, '&quot;');
        const safeLocation = (item.location || '').replace(/"/g, '&quot;');
        const safeOwnerName = (item.owner_name || '').replace(/"/g, '&quot;');
        if (!itemGrid) return;

        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
        const itemId = item.item_id || item.id;
        const itemOwnerId = item.user_id || item.userId;
        const isOwner = currentUserId && String(currentUserId) === String(itemOwnerId);

        // จัดการเรื่องภาพ (เช็ก item.images ที่มีหลายรูปก่อน แล้วค่อย fallback ไปที่ item.image_url)
        let imagesArray = [];
        if (Array.isArray(item.images) && item.images.length > 0) {
            imagesArray = item.images;
        } else if (item.image_url) {
            imagesArray = [item.image_url];
        } else {
            imagesArray = ['/assets/pansuk_icon.jpg'];
        }

        const itemType = item.item_type || item.itemType || 'free';
        const price = item.price || 0;
        const latVal = item.latitude || item.lat; const lngVal = item.longitude || item.lng; const hasCoordinates = latVal !== null && latVal !== undefined && latVal !== '' && lngVal !== null && lngVal !== undefined && lngVal !== '' && Number.isFinite(Number(latVal)) && Number.isFinite(Number(lngVal));

        const typeBadge = itemType === 'sell'
            ? '<span class="badge bg-primary me-1">ขาย</span>'
            : itemType === 'rent'
                ? '<span class="badge bg-warning text-dark me-1">ให้เช่า</span>'
                : '<span class="badge bg-success me-1">แจกฟรี</span>';

        const approvalBadge = (item.is_approved === 0 || item.is_approved === false)
            ? '<span class="badge bg-warning text-dark me-1 shadow-sm"><i class="bi bi-hourglass-split"></i> รออนุมัติ</span>'
            : (item.is_approved === -1)
                ? '<span class="badge bg-danger me-1 shadow-sm"><i class="bi bi-x-circle"></i> ไม่อนุมัติ</span>'
                : '';

        let statusLabel = (item.status === 'completed' || item.status === 'reserved')
            ? (itemType === 'free' ? 'แจกหมดแล้ว' : 'ปิดการขาย/จองแล้ว')
            : (itemType === 'free' ? 'พร้อมแจก' : 'พร้อมใช้งาน');
        if (item.is_approved === 0 || item.is_approved === false) {
            statusLabel = '⏳ รอแอดมินตรวจ';
        }

        const priceTagText = itemType === 'sell'
            ? `฿${Number(price).toLocaleString()}`
            : itemType === 'rent'
                ? `฿${Number(price).toLocaleString()}/วัน`
                : 'ฟรี';

        const imagesJson = JSON.stringify(imagesArray).replace(/"/g, '&quot;');
        const isFreeItem = itemType === 'free';
        const isCompleted = item.status === 'completed' || item.status === 'reserved';
        const toggleBtnHTML = isFreeItem ? `
            <button class="btn ${isCompleted ? 'btn-outline-success' : 'btn-outline-secondary'} btn-sm item-toggle-status-btn" type="button" style="font-size: 0.78rem; white-space: nowrap;">
                ${isCompleted ? '🔄 มีของอยู่' : '❌ หมดแล้ว'}
            </button>
        ` : `
            <button class="btn btn-outline-success btn-sm item-requests-btn position-relative" type="button" style="font-size: 0.78rem; white-space: nowrap;">
                📋 คำขอ ${item.pending_requests > 0 ? `<span class="badge rounded-pill bg-danger" style="font-size: 0.65rem;">${item.pending_requests}</span>` : ""}
            </button>
        `;

        const ownerControls = isOwner ? `
            <div class="item-owner-controls mt-2 pt-2 border-top" data-item-id="${itemId}">
                <button class="btn btn-outline-primary btn-sm item-edit-btn" type="button" style="font-size: 0.78rem; white-space: nowrap;">✏️ แก้ไข</button>
                <button class="btn btn-outline-danger btn-sm item-delete-btn" type="button" style="font-size: 0.78rem; white-space: nowrap;">🗑️ ลบ</button>
                ${toggleBtnHTML}
                <button class="btn btn-outline-dark btn-sm item-messages-btn" type="button" style="font-size: 0.78rem; white-space: nowrap;">💬 ข้อความ</button>
            </div>
        ` : '';

        const ownerBadgeHTML = item.owner_name ? `
            <div class="small text-muted mb-1 d-flex align-items-center gap-1">
                <span class="fw-bold text-dark">👤 ${item.owner_name}</span>
                <span class="badge bg-purple text-white rounded-pill" style="background-color: #6f42c1;">Lv.${item.owner_level || 1}</span>
                <span class="text-warning fw-bold">⭐ ${Number(item.owner_rating || 0).toFixed(1)}</span>
            </div>
        ` : '';

        const newCardHTML = `
            <div class="col-6 col-md-4 col-lg-3 item-element" data-item-id="${itemId}" data-category="${item.category}" data-title="${safeTitle}" data-latitude="${hasCoordinates ? (item.latitude || item.lat) : ''}" data-longitude="${hasCoordinates ? (item.longitude || item.lng) : ''}">
                <div class="card item-card h-100 position-relative shadow-sm border-0 rounded-4 overflow-hidden">
                    <div class="position-absolute top-0 start-0 p-2 z-2 d-flex flex-wrap gap-1 align-items-center">
                        ${typeBadge}
                        ${approvalBadge}
                        ${isOwner ? '<span class="badge bg-success bg-opacity-75 rounded-pill shadow-sm"><i class="bi bi-person-check-fill me-1"></i>ของฉัน</span>' : ''}
                        <span class="badge bg-dark bg-opacity-75">${item.category}</span>
                    </div>
                    ${imagesArray.length > 1 ? `
                        <div class="position-absolute top-0 end-0 p-2 z-2">
                            <span class="badge bg-dark bg-opacity-75 rounded-pill shadow-sm"><i class="bi bi-images me-1"></i>${imagesArray.length}</span>
                        </div>
                    ` : ''}
                    <img src="${imagesArray[0]}" class="card-img-top item-card-img" alt="${item.title}" loading="lazy" decoding="async">
                    <div class="card-body d-flex flex-column p-2 p-md-3">
                        ${ownerBadgeHTML}
                        <div class="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-1">
                            <h6 class="card-title fw-bold mb-0 text-truncate flex-grow-1" style="max-width: 100%; font-size: 0.95rem;">${item.title}</h6>
                            <span class="fw-bold text-success fs-6">${priceTagText}</span>
                        </div>
                        <p class="card-text text-muted small mb-1 text-truncate" style="font-size: 0.78rem;">📍 ${item.location || 'ไม่ระบุสถานที่'} ${hasCoordinates ? '<span class="item-distance text-success fw-semibold"></span>' : ''}</p>
                        <p class="card-text text-secondary text-truncate small mb-1 d-none d-sm-block">${item.description || ''}</p>
                        <div class="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-1">
                            <span class="badge bg-secondary">${statusLabel}</span>
                            ${(item.quantity !== undefined && item.quantity > 0) ? `<span class="badge bg-info text-dark">เหลือ ${item.quantity}</span>` : (item.quantity === 0 ? `<span class="badge bg-danger">หมด</span>` : '')}
                        </div>
                        <div class="mt-auto pt-2 border-top d-flex flex-column flex-sm-row justify-content-between align-items-center gap-1">
                            <span class="small text-muted d-none d-md-inline" style="font-size: 0.75rem;">${new Date(item.created_at || Date.now()).toLocaleDateString('th-TH')}</span>
                            <button class="btn btn-outline-success btn-sm w-100 w-sm-auto px-3 rounded-pill fw-bold request-btn py-1" style="font-size: 0.8rem;"
                                data-title="${safeTitle}"
                                data-category="${item.category}"
                                data-type="${itemType}"
                                data-owner-id="${itemOwnerId}"
                                data-owner-name="${safeOwnerName}"
                                data-owner-level="${item.owner_level || 1}"
                                data-owner-rating="${Number(item.owner_rating || 0).toFixed(1)}"
                                data-latitude="${hasCoordinates ? item.latitude : ''}"
                                data-longitude="${hasCoordinates ? item.longitude : ''}"
                                data-price="${price}"
                                data-quantity="${item.quantity ?? 1}"
                                data-status="${item.status || 'available'}"
                                data-location="${safeLocation}"
                                data-description="${safeDescription}"
                                data-deposit="${item.deposit || 0}"
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
    
    
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            window.loadItemsFromDB(true);
        });
    }

    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadItemsFromDB();
        });
    }

    // Auto-reload items when dropdown filters change
    ['typeFilter', 'categoryFilter', 'sortFilter', 'statusFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                loadItemsFromDB();
            });
        }
    });

    // Auto-reload items when price filters change (debounced 500ms)
    let priceFilterDebounce = null;
    ['minPriceFilter', 'maxPriceFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                clearTimeout(priceFilterDebounce);
                priceFilterDebounce = setTimeout(() => {
                    loadItemsFromDB();
                }, 500);
            });
        }
    });

    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (filterForm) filterForm.reset();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = '';
            // รีเซ็ตปุ่ม Pill ในแบนเนอร์ของฉัน
            document.querySelectorAll('.my-status-pill').forEach((btn, idx) => {
                if (idx === 0) {
                    btn.classList.add('active', 'btn-light', 'text-success', 'shadow-sm');
                    btn.classList.remove('btn-outline-light');
                } else {
                    btn.classList.remove('active', 'btn-light', 'text-success', 'shadow-sm');
                    btn.classList.add('btn-outline-light');
                }
            });
            loadItemsFromDB();
        });
    }

    // จัดการคลิกปุ่มกรองสถานะเฉพาะในแบนเนอร์ของฉัน (Status Pills)
    document.addEventListener('click', (e) => {
        const pill = e.target.closest('.my-status-pill');
        if (pill) {
            e.preventDefault();
            const status = pill.dataset.status ?? '';
            const statusInput = document.getElementById('statusFilter');
            if (statusInput) statusInput.value = status;

            document.querySelectorAll('.my-status-pill').forEach(btn => {
                btn.classList.remove('active', 'btn-light', 'text-success', 'shadow-sm');
                btn.classList.add('btn-outline-light');
            });
            pill.classList.add('active', 'btn-light', 'text-success', 'shadow-sm');
            pill.classList.remove('btn-outline-light');

            currentPage = 1;
            window.loadItemsFromDB();
        }
    });

    // ----------------------------------------------------
    // ฟังก์ชันสลับโหมดหน้ารวมสินค้า: 'all' (สำรวจของใกล้ตัว) VS 'my_listings' (รายการที่ฉันประกาศ)
    // ----------------------------------------------------
    window.switchFeedMode = function(mode, scroll = true) {
        const tabAll = document.getElementById('tab-all-items');
        const tabMy = document.getElementById('tab-my-items');
        const banner = document.getElementById('myListingsBanner');
        const feedHeaderContainer = document.getElementById('feedHeaderContainer');
        const feedMainTitle = document.getElementById('feedMainTitle');

        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');

        if (mode === 'my_listings') {
            if (!token || !currentUser) {
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) {
                    const loginModal = bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
                    loginModal.show();
                }
                return;
            }

            window.currentFeedMode = 'my_listings';
            try {
                history.replaceState(null, '', '#my-listings');
            } catch (e) {}

            if (tabAll) {
                tabAll.classList.remove('active');
                tabAll.classList.add('text-secondary');
            }
            if (tabMy) {
                tabMy.classList.add('active');
                tabMy.classList.remove('text-secondary');
            }

            if (banner) banner.classList.remove('d-none');
            if (feedHeaderContainer) feedHeaderContainer.classList.add('d-none');

            currentPage = 1;
            window.loadItemsFromDB();

            if (scroll) {
                const target = document.getElementById('myListingsBanner') || document.getElementById('filterForm') || document.getElementById('itemGrid');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        } else {
            window.currentFeedMode = 'all';
            if (window.location.hash === '#my-listings') {
                try {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                } catch (e) {}
            }

            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) statusFilter.value = '';

            // รีเซ็ตปุ่มสถานะในแบนเนอร์
            document.querySelectorAll('.my-status-pill').forEach((btn, idx) => {
                if (idx === 0) {
                    btn.classList.add('active', 'btn-light', 'text-success', 'shadow-sm');
                    btn.classList.remove('btn-outline-light');
                } else {
                    btn.classList.remove('active', 'btn-light', 'text-success', 'shadow-sm');
                    btn.classList.add('btn-outline-light');
                }
            });

            if (tabAll) {
                tabAll.classList.add('active');
                tabAll.classList.remove('text-secondary');
            }
            if (tabMy) {
                tabMy.classList.remove('active');
                tabMy.classList.add('text-secondary');
            }

            if (banner) banner.classList.add('d-none');
            if (feedHeaderContainer) feedHeaderContainer.classList.remove('d-none');
            if (feedMainTitle) feedMainTitle.innerHTML = '✨ รายการของแจก ล่าสุดใกล้ตัวคุณ';

            currentPage = 1;
            window.loadItemsFromDB();

            if (scroll) {
                const target = document.getElementById('feedHeaderContainer') || document.getElementById('filterForm') || document.getElementById('itemGrid');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    };

    window.refreshMyItemsCount = async function() {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/items/mine?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.stats) {
                const countBadge = document.getElementById('myItemsCountBadge');
                if (countBadge) {
                    const activeCount = (Number(data.stats.available || 0) + Number(data.stats.pending || 0));
                    countBadge.textContent = activeCount;
                    countBadge.classList.toggle('d-none', activeCount === 0);
                }
                const elTotal = document.getElementById('myStatsTotal');
                const elAvail = document.getElementById('myStatsAvailable');
                const elPend = document.getElementById('myStatsPending');
                const elComp = document.getElementById('myStatsCompleted');
                if (elTotal) elTotal.textContent = data.stats.total;
                if (elAvail) elAvail.textContent = data.stats.available;
                if (elPend) elPend.textContent = data.stats.pending;
                if (elComp) elComp.textContent = data.stats.completed || 0;
            }
        } catch (e) {}
    };

    // ตรวจสอบ URL Hash เพื่อเปิดโหมดที่ต้องการเมื่อโหลดหน้า
    if (window.location.hash === '#my-listings') {
        window.switchFeedMode('my_listings', false);
    } else {
        window.loadItemsFromDB();
        window.refreshMyItemsCount();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#my-listings' && window.currentFeedMode !== 'my_listings') {
            window.switchFeedMode('my_listings', true);
        } else if (window.location.hash !== '#my-listings' && window.currentFeedMode === 'my_listings') {
            window.switchFeedMode('all', true);
        }
    });

    // ----------------------------------------------------
    // 3. ดักจับการลงประกาศใหม่ (บันทึกลง Database ผ่าน API)
    // ----------------------------------------------------
    let isSubmittingPost = false;
    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'postItemForm') {
            e.preventDefault();

            // 🛑 ป้องกันการกดโพสต์ซ้ำ (Double-click lock)
            if (isSubmittingPost) return;

            // 📌 [แก้ไข] ตรวจสอบผู้ใช้ผ่าน LocalStorage แบบยืดหยุ่น (รองรับ id / user_id / userId)
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.id || user?.user_id || user?.userId;

            if (!user || !userId) {
                alert('⚠️ กรุณาเข้าสู่ระบบก่อนทำการลงประกาศสิ่งของ');
                return;
            }

            const itemType = document.querySelector('input[name="itemType"]:checked')?.value || 'free';
            


            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

            const price = document.getElementById('postPrice')?.value || '0';
            const deposit = document.getElementById('postDeposit')?.value || '0';
            const quantity = document.getElementById('postQuantity')?.value || '1';
            const title = document.getElementById('postTitle')?.value || 'รายการใหม่';
            const category = document.getElementById('postCategory')?.value || 'อื่นๆ';
            const location = document.getElementById('postLocation')?.value || 'ละแวกใกล้เคียง';
            const description = document.getElementById('postDescription')?.value || '';
            const imageInput = document.getElementById('postImageFile');

            let coordinates = { latitude: null, longitude: null };
            const mapLat = document.getElementById('itemLat')?.value;
            const mapLng = document.getElementById('itemLng')?.value;
            if (mapLat && mapLng) {
                coordinates.latitude = parseFloat(mapLat);
                coordinates.longitude = parseFloat(mapLng);
            } else {
                try {
                    coordinates = await getCurrentCoordinates();
                } catch (error) {
                    alert('กรุณาปักหมุดบนแผนที่ หรืออนุญาตตำแหน่ง');
                    return;
                }
            }

            // ล็อกสถานะและแสดงปุ่มโหลดทันทีเพื่อป้องกันการกดซ้ำ
            isSubmittingPost = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังบันทึกและส่งข้อมูล...';
            }

            // จัดเตรียมข้อมูลส่งแบบ FormData เพื่อรองรับการอัปโหลดไฟล์
            const formData = new FormData();
            formData.append('user_id', userId); // 📌 ส่ง userId ที่เช็กผ่านแน่ๆ ไปยัง Backend
            formData.append('title', title);
            formData.append('category', category);
            formData.append('quantity', quantity);
            formData.append('item_type', itemType);
            formData.append('price', price);
            formData.append('deposit', deposit);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('latitude', coordinates.latitude);
            formData.append('longitude', coordinates.longitude);

            if (selectedPostFiles && selectedPostFiles.length > 0) {
                const maxFiles = Math.min(selectedPostFiles.length, 5);
                for (let i = 0; i < maxFiles; i++) {
                    formData.append('images', selectedPostFiles[i]);
                }
            } else if (imageInput && imageInput.files && imageInput.files.length > 0) {
                const maxFiles = Math.min(imageInput.files.length, 5);
                for (let i = 0; i < maxFiles; i++) {
                    formData.append('images', imageInput.files[i]);
                }
            }

            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    // ปิด Modal ทันที
                    const postModalEl = document.getElementById('postItemModal');
                    if (postModalEl) {
                        const modalInstance = bootstrap.Modal.getInstance(postModalEl);
                        if (modalInstance) modalInstance.hide();
                    }

                    // แจ้งเตือนผู้ใช้ชัดเจนเรื่องรอแอดมินอนุมัติ
                    alert('🎉 ส่งข้อมูลลงประกาศสำเร็จเรียบร้อยแล้ว!\n\nรายการของคุณถูกส่งไปยังผู้ดูแลระบบ (Admin) เพื่อตรวจสอบความถูกต้องและความปลอดภัยเรียบร้อยแล้ว\nเมื่อแอดมินทำการอนุมัติ รายการจะปรากฏบนหน้าเว็บทันทีครับ');

                    // รีเซ็ตฟอร์ม รูปภาพ และพิกัด
                    e.target.reset();
                    selectedPostFiles = [];
                    renderPostImagePreviews();

                    const itemLat = document.getElementById('itemLat');
                    const itemLng = document.getElementById('itemLng');
                    const latLngDisplay = document.getElementById('latLngDisplay');
                    if (itemLat) itemLat.value = '';
                    if (itemLng) itemLng.value = '';
                    if (latLngDisplay) {
                        latLngDisplay.innerText = 'ยังไม่ได้เลือก';
                        latLngDisplay.classList.add('text-danger');
                        latLngDisplay.classList.remove('text-success');
                    }
                    if (addMarker && addMap) {
                        addMap.removeLayer(addMarker);
                        addMarker = null;
                    }

                    // สลับมายังโหมด 'รายการที่ฉันประกาศ' ทันที เพื่อให้เห็นของที่เพิ่งลง
                    if (typeof window.switchFeedMode === 'function') {
                        window.switchFeedMode('my_listings', true);
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        loadItemsFromDB();
                    }
                } else {
                    alert('❌ ไม่สามารถบันทึกข้อมูลได้: ' + (data.message || 'เกิดข้อผิดพลาด'));
                }
            } catch (err) {
                console.error('Error submitting item:', err);
                alert('⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
            } finally {
                isSubmittingPost = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        }
    });

    // ----------------------------------------------------
    // 📸 จัดการการเลือกรูปภาพหลายรูป (สูงสุด 5 รูป) สำหรับฟอร์มลงประกาศ
    // ----------------------------------------------------
    let selectedPostFiles = [];

    function renderPostImagePreviews() {
        const container = document.getElementById('postImagePreviewContainer');
        const badge = document.getElementById('postImageCountBadge');
        const promptBox = document.getElementById('postImagePromptBox');
        if (!container) return;

        container.innerHTML = '';
        selectedPostFiles.forEach((file, index) => {
            const objectUrl = URL.createObjectURL(file);
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'position-relative border rounded-3 overflow-hidden shadow-sm';
            thumbDiv.style.width = '85px';
            thumbDiv.style.height = '85px';
            thumbDiv.innerHTML = `
                <img src="${objectUrl}" class="w-100 h-100 object-fit-cover" alt="รูปที่ ${index + 1}">
                ${index === 0 ? '<span class="position-absolute bottom-0 start-0 w-100 bg-success text-white text-center py-0" style="font-size: 0.65rem;">รูปหน้าปก</span>' : ''}
                <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center remove-post-img-btn" data-index="${index}" style="width: 22px; height: 22px; font-size: 0.75rem; border-radius: 0 0 0 6px;">✕</button>
            `;
            container.appendChild(thumbDiv);
        });

        if (badge) {
            badge.textContent = `${selectedPostFiles.length}/5 รูป`;
            badge.className = selectedPostFiles.length === 5 ? 'badge bg-success rounded-pill' : 'badge bg-secondary rounded-pill';
        }

        if (promptBox) {
            if (selectedPostFiles.length >= 5) {
                promptBox.classList.add('d-none');
            } else {
                promptBox.classList.remove('d-none');
            }
        }
    }

    document.addEventListener('click', (e) => {
        // ปุ่มกดเลือกรูป
        if (e.target && (e.target.id === 'triggerImageUploadBtn' || e.target.closest('#triggerImageUploadBtn'))) {
            e.preventDefault();
            const fileInput = document.getElementById('postImageFile');
            if (fileInput) {
                fileInput.value = '';
                fileInput.click();
            }
        }

        // ปุ่มลบรูป
        const removeBtn = e.target.closest('.remove-post-img-btn');
        if (removeBtn) {
            e.preventDefault();
            const idx = parseInt(removeBtn.dataset.index, 10);
            if (!isNaN(idx) && idx >= 0 && idx < selectedPostFiles.length) {
                selectedPostFiles.splice(idx, 1);
                renderPostImagePreviews();
            }
        }
    });

    // ฟังก์ชันย่อขนาดรูปภาพก่อนแสดงผลและอัปโหลด เพื่อให้โพสต์ไวและประหยัดเน็ต/แรมมือถือ
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

    document.addEventListener('change', async (e) => {
        if (e.target && e.target.id === 'postImageFile') {
            const files = Array.from(e.target.files || []);
            for (const file of files) {
                if (selectedPostFiles.length >= 5) {
                    alert('คุณสามารถเลือกรูปภาพได้สูงสุดไม่เกิน 5 รูปครับ');
                    break;
                }
                if (!file.type.startsWith('image/')) {
                    alert('กรุณาเลือกเฉพาะไฟล์รูปภาพ (JPG, PNG, WEBP)');
                    continue;
                }
                const compressed = await compressImageFile(file, 1200, 0.82);
                selectedPostFiles.push(compressed);
            }
            renderPostImagePreviews();
        }
    });


    // ----------------------------------------------------
    // 4. ดักจับการกดปุ่ม "ดูรายละเอียด"
    // ----------------------------------------------------
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.request-btn');
        if (btn) {
            if (btn.closest('.hero-section') || btn.closest('.navbar')) return;

            const card = btn.closest('.card');
            const itemCard = btn.closest('.item-element');
            const itemId = itemCard?.dataset.itemId;
            const ownerId = btn.dataset.ownerId;
            const title = btn.dataset.title || card?.querySelector('.card-title')?.innerText || 'รายการสิ่งของ';
            const category = btn.dataset.category || 'ของใช้';
            const location = btn.dataset.location || card?.querySelector('.text-muted')?.innerText || 'ใกล้ตัวคุณ';
            const description = btn.dataset.description || card?.querySelector('.text-secondary')?.innerText || 'ไม่มีรายละเอียด';
            const price = btn.dataset.price || '0';
            const deposit = Number(btn.dataset.deposit || 0);
            const distance = btn.dataset.distance || '';

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
                else images.push('/assets/pansuk_icon.jpg');
            }

            const ownerName = btn.dataset.ownerName || '';
            const ownerLevel = btn.dataset.ownerLevel || '1';
            const ownerRating = btn.dataset.ownerRating || '0.0';
            const quantity = Number(btn.dataset.quantity ?? 1);
            const status = btn.dataset.status || 'available';
            
            // FIX: use dataset from button if itemCard is null
            const lat = btn.dataset.latitude || (itemCard ? itemCard.dataset.latitude : '');
            const lng = btn.dataset.longitude || (itemCard ? itemCard.dataset.longitude : '');

            showItemDetailModal({ itemId, ownerId, ownerName, ownerLevel, ownerRating, title, category, itemType, price, deposit, quantity, status, location, description, images, distance, lat, lng });
        }
    });

    // ----------------------------------------------------
    // 5. ฟังก์ชันสร้าง Modal ขนาดใหญ่ + Layout แนวตั้ง (รูปบน -> ข้อมูลกลาง -> ปุ่มล่าง)
    // ----------------------------------------------------
    
    // ----------------------------------------------------
    // 🔑 ฟังก์ชันเปิด Modal ปฏิทินจองเช่าสินค้า + คำนวณราคา Real-time
    // ----------------------------------------------------
        function openRentalBookingModal(item) {
        document.getElementById('rentalBookingModal')?.remove();

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatISODate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const minDateStr = formatISODate(today);
        let defaultStartStr = minDateStr;
        let defaultEndStr = formatISODate(tomorrow);

        const dailyPrice = Number(item.price || 0);
        const deposit = Number(item.deposit || 0);

        const modalHTML = `
            
<style id="rentalCalendarFullWidthStyle">
    #rentalBookingModal .flatpickr-calendar {
        width: 100% !important;
        max-width: 100% !important;
        box-shadow: none !important;
        border: none !important;
        background: transparent !important;
        margin: 0 auto !important;
    }
    #rentalBookingModal .flatpickr-innerContainer {
        width: 100% !important;
        display: block !important;
    }
    #rentalBookingModal .flatpickr-rContainer {
        width: 100% !important;
        max-width: 100% !important;
    }
    #rentalBookingModal .flatpickr-weekdays {
        width: 100% !important;
        height: 36px !important;
    }
    #rentalBookingModal .flatpickr-weekdaycontainer {
        width: 100% !important;
        display: flex !important;
    }
    #rentalBookingModal span.flatpickr-weekday {
        flex: 1 !important;
        max-width: 14.2857% !important;
        font-size: 0.95rem !important;
        font-weight: 700 !important;
        color: #495057 !important;
    }
    #rentalBookingModal .flatpickr-days {
        width: 100% !important;
        display: block !important;
    }
    #rentalBookingModal .dayContainer {
        width: 100% !important;
        min-width: 100% !important;
        max-width: 100% !important;
        display: flex !important;
        flex-wrap: wrap !important;
        justify-content: flex-start !important;
    }
    #rentalBookingModal .flatpickr-day {
        max-width: 14.2857% !important;
        width: 14.2857% !important;
        flex-basis: 14.2857% !important;
        height: 40px !important;
        line-height: 40px !important;
        font-size: 1rem !important;
        font-weight: 600 !important;
        margin: 1px 0 !important;
        border: none !important;
    }
    #rentalBookingModal .flatpickr-months {
        padding: 4px 0 !important;
        margin-bottom: 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
    }
    #rentalBookingModal .flatpickr-current-month {
        font-size: 1.15rem !important;
        font-weight: 700 !important;
        padding-top: 2px !important;
        position: static !important;
        width: auto !important;
    }
    #rentalBookingModal .numInputWrapper {
        display: inline-block !important;
        width: 55px !important;
    }
    #rentalBookingModal .numInputWrapper span {
        display: none !important;
    }

    /* เมื่อเลือกวันเดียว */
    #rentalBookingModal .flatpickr-day.selected.startRange.endRange {
        border-radius: 50px !important;
        background: #0d6efd !important;
        border-color: #0d6efd !important;
        color: #ffffff !important;
        box-shadow: none !important;
    }

    /* วันเริ่มต้น (startRange) */
    #rentalBookingModal .flatpickr-day.selected.startRange,
    #rentalBookingModal .flatpickr-day.startRange {
        border-radius: 50px 0 0 50px !important;
        background: #0d6efd !important;
        border-color: #0d6efd !important;
        color: #ffffff !important;
    }

    /* วันสิ้นสุด (endRange) */
    #rentalBookingModal .flatpickr-day.selected.endRange,
    #rentalBookingModal .flatpickr-day.endRange {
        border-radius: 0 50px 50px 0 !important;
        background: #0d6efd !important;
        border-color: #0d6efd !important;
        color: #ffffff !important;
    }

    /* แก้ไขเงาสีฟ้าตรงกลางเมื่อเลือกวันติดกัน (เช่น 20-21) ให้เป็นสีน้ำเงินเดียวกันสนิท ไร้รอยต่อ */
    #rentalBookingModal .flatpickr-day.selected.startRange + .endRange:not(:nth-child(7n+1)),
    #rentalBookingModal .flatpickr-day.startRange.startRange + .endRange:not(:nth-child(7n+1)),
    #rentalBookingModal .flatpickr-day.endRange.startRange + .endRange:not(:nth-child(7n+1)) {
        -webkit-box-shadow: -10px 0 0 #0d6efd !important;
        box-shadow: -10px 0 0 #0d6efd !important;
    }

    /* วันที่อยู่ระหว่างกลาง (inRange) */
    #rentalBookingModal .flatpickr-day.inRange {
        background: #e7f1ff !important;
        border-color: #e7f1ff !important;
        color: #0d6efd !important;
        border-radius: 0 !important;
        -webkit-box-shadow: -5px 0 0 #e7f1ff, 5px 0 0 #e7f1ff !important;
        box-shadow: -5px 0 0 #e7f1ff, 5px 0 0 #e7f1ff !important;
    }
</style>

            <div class="modal fade" id="rentalBookingModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 640px;">
                    <div class="modal-content border-0 shadow-lg rounded-5 overflow-hidden">
                        <div class="modal-header bg-warning bg-opacity-25 border-0 p-4 pb-2">
                            <div>
                                <span class="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bold mb-1">🔑 ปฏิทินจองเช่าสินค้า</span>
                                <h4 class="modal-title fw-bold text-dark mb-0">เลือกวันที่ต้องการเช่า</h4>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div class="modal-body p-4 pt-2">
                            <!-- รายละเอียดสินค้าสั้นๆ -->
                            <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-4 mb-3 border">
                                <img src="${(item.images && item.images[0]) || item.image_url || 'https://via.placeholder.com/80'}" 
                                     class="rounded-3 object-fit-cover shadow-sm" style="width: 70px; height: 70px;">
                                <div class="flex-grow-1">
                                    <h6 class="fw-bold mb-1 text-truncate" style="max-width: 320px;">${item.title}</h6>
                                    <div class="small text-muted mb-1">ผู้ปล่อยเช่า: <strong>${item.ownerName || 'เจ้าของสินค้า'}</strong></div>
                                    <div class="badge bg-warning text-dark">ค่าเช่า ฿${dailyPrice.toLocaleString()}/วัน</div>
                                    ${deposit > 0 ? `<div class="badge bg-secondary ms-1">มัดจำ ฿${deposit.toLocaleString()}</div>` : ''}
                                </div>
                            </div>

                            <!-- ส่วนปฏิทินแบบ Interactive Grid -->
                            <div class="bg-white p-3 rounded-4 border shadow-sm mb-3 text-center">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <h6 class="fw-bold text-dark mb-0"><i class="bi bi-calendar3 me-2 text-warning"></i>จิ้มเลือกวันบนปฏิทิน (วันเริ่ม ➡️ วันคืน):</h6>
                                </div>
                                
                                <!-- Container ปฏิทินแบบแสดงผลทันที -->
                                <div id="rentalInlineCalendar" class="w-100 my-2"></div>

                                <!-- ช่องระบุวันที่ (ซิงค์กับปฏิทิน) -->
                                <div class="row g-2 mt-2 pt-2 border-top text-start">
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-muted mb-1">📅 วันเริ่มเช่า</label>
                                        <input type="date" id="rentalStartDateInput" class="form-control rounded-3 fw-bold border-2" 
                                               min="${minDateStr}" value="${defaultStartStr}" onclick="if (this.showPicker) this.showPicker();">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-muted mb-1">🏁 วันส่งคืน</label>
                                        <input type="date" id="rentalEndDateInput" class="form-control rounded-3 fw-bold border-2" 
                                               min="${defaultStartStr}" value="${defaultEndStr}" onclick="if (this.showPicker) this.showPicker();">
                                    </div>
                                </div>
                            </div>

                            <!-- กล่องคำนวณราคาแบบ Real-time -->
                            <div class="card border-0 bg-light rounded-4 p-3 mb-4 border">
                                <h6 class="fw-bold text-dark mb-2">สรุปค่าใช้จ่าย:</h6>
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted">⏱️ ระยะเวลาเช่า:</span>
                                    <span class="fw-bold text-dark"><span id="calcRentalDays">1</span> วัน</span>
                                </div>
                                <div class="d-flex justify-content-between mb-1">
                                    <span class="text-muted">💵 ค่าเช่ารวม (฿${dailyPrice.toLocaleString()} × <span id="calcDaysMultiply">1</span> วัน):</span>
                                    <span class="fw-bold text-dark">฿<span id="calcTotalRent">0</span></span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span class="text-muted">🛡️ เงินมัดจำประกันสินค้า (คืนเมื่อส่งของครบ):</span>
                                    <span class="fw-bold text-primary">฿<span id="calcDeposit">0</span></span>
                                </div>
                                <div class="alert alert-warning py-2 px-3 mt-2 mb-2 rounded-3 small border border-warning-subtle text-start" style="font-size: 0.8rem; line-height: 1.45;">
                                    <i class="bi bi-shield-exclamation text-warning me-1"></i>
                                    <strong>ข้อตกลงเงินมัดจำ:</strong> เงินมัดจำจะถูกดูแลโดยคนกลาง (แอดมิน) และจะได้รับคืนเต็มจำนวนเมื่อส่งคืนสินค้าในสภาพสมบูรณ์ ทั้งนี้ <em>หากเกิดกรณีที่สินค้าชำรุด/พังเสียหายจริงแล้วผู้เช่าไม่ยินยอมให้หัก หากแอดมินตรวจสอบพยานหลักฐานแล้วพบว่าชำรุดจริง แอดมินมีสิทธิ์ตัดสินใจโอนเงินมัดจำชดเชยค่าเสียหายให้เจ้าของสินค้าได้ทันที</em>
                                </div>
                                <hr class="my-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="fw-bold fs-5 text-dark">💳 ยอดรวมทั้งสิ้น:</span>
                                    <span class="display-6 fw-bold text-success mb-0" style="font-size: 1.75rem;">฿<span id="calcGrandTotal">0</span></span>
                                </div>
                            </div>

                            <!-- 2 ทางเลือก: นัดรับคุยตรง หรือ ผ่านระบบคนกลาง -->
                            <h6 class="fw-bold text-dark mb-2">เลือกรูปแบบการเช่า:</h6>
                            <div class="d-flex flex-column gap-2">
                                <button type="button" class="btn btn-primary p-3 rounded-4 shadow-sm fw-bold fs-6" id="rentalEscrowBtn">
                                    🛡️ เช่าผ่านระบบคนกลาง (ปลอดภัย 100%)
                                    <div class="small opacity-75 fw-normal">พักค่าเช่า + เงินมัดจำไว้ที่ระบบ ปล่อยเงินและคืนมัดจำเมื่อตรวจรับของ</div>
                                </button>
                                <button type="button" class="btn btn-outline-success p-3 rounded-4 shadow-sm fw-bold fs-6" id="rentalDirectBtn">
                                    🤝 ส่งคำขอนัดรับเช่า (นัดรับ/จ่ายเงินโดยตรง)
                                    <div class="small opacity-75 fw-normal">ส่งคำขอเช่าพร้อมสรุปวันและยอดรวมหาผู้ให้เช่าทันที</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modalEl = document.getElementById('rentalBookingModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        const startInput = document.getElementById('rentalStartDateInput');
        const endInput = document.getElementById('rentalEndDateInput');
        const calcDaysEl = document.getElementById('calcRentalDays');
        const calcMultiplyEl = document.getElementById('calcDaysMultiply');
        const calcRentEl = document.getElementById('calcTotalRent');
        const calcDepositEl = document.getElementById('calcDeposit');
        const calcGrandTotalEl = document.getElementById('calcGrandTotal');

        function calculateRental() {
            const startVal = startInput.value;
            const endVal = endInput.value;
            if (!startVal || !endVal) return null;

            const startDate = new Date(startVal);
            const endDate = new Date(endVal);

            if (endDate < startDate) {
                endInput.value = startVal;
                return calculateRental();
            }

            const diffTime = endDate.getTime() - startDate.getTime();
            const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
            const totalRent = dailyPrice * days;
            const grandTotal = totalRent + deposit;

            calcDaysEl.textContent = days;
            calcMultiplyEl.textContent = days;
            calcRentEl.textContent = totalRent.toLocaleString();
            calcDepositEl.textContent = deposit.toLocaleString();
            calcGrandTotalEl.textContent = grandTotal.toLocaleString();

            return { days, totalRent, deposit, grandTotal, startVal, endVal };
        }

        // Initialize Flatpickr if available
        let fpInstance = null;
        if (typeof flatpickr !== 'undefined') {
            try {
                fpInstance = flatpickr("#rentalInlineCalendar", {
                    inline: true,
                    mode: "range",
                    minDate: "today",
                    defaultDate: [defaultStartStr, defaultEndStr],
                    locale: flatpickr.l10ns?.th || undefined,
                    dateFormat: "Y-m-d",
                    onChange: function(selectedDates) {
                        if (selectedDates.length === 2) {
                            startInput.value = formatISODate(selectedDates[0]);
                            endInput.value = formatISODate(selectedDates[1]);
                            calculateRental();
                        } else if (selectedDates.length === 1) {
                            startInput.value = formatISODate(selectedDates[0]);
                            endInput.value = formatISODate(selectedDates[0]);
                            calculateRental();
                        }
                    }
                });
            } catch (err) {
                console.warn('Flatpickr init fallback to inputs', err);
            }
        }

        startInput.addEventListener('change', () => {
            endInput.min = startInput.value;
            if (endInput.value < startInput.value) {
                endInput.value = startInput.value;
            }
            if (fpInstance) {
                fpInstance.setDate([startInput.value, endInput.value]);
            }
            calculateRental();
        });

        endInput.addEventListener('change', () => {
            if (endInput.value < startInput.value) {
                endInput.value = startInput.value;
            }
            if (fpInstance) {
                fpInstance.setDate([startInput.value, endInput.value]);
            }
            calculateRental();
        });

        // คำนวณครั้งแรก
        calculateRental();

        // กดปุ่มเช่าผ่านระบบคนกลาง
        document.getElementById('rentalEscrowBtn').addEventListener('click', () => {
            const calc = calculateRental();
            if (!calc) return;
            modal.hide();
            if (typeof window.startEscrowPurchase === 'function') {
                window.startEscrowPurchase(item, {
                    rental_start_date: calc.startVal,
                    rental_end_date: calc.endVal,
                    rental_days: calc.days,
                    deposit_amount: calc.deposit
                });
            }
        });

        // กดปุ่มส่งคำขอนัดรับเช่า
        document.getElementById('rentalDirectBtn').addEventListener('click', async () => {
            const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
            const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
            if (!currentUserId) {
                alert('กรุณาเข้าสู่ระบบก่อนส่งคำขอนัดรับเช่า');
                const loginModalEl = document.getElementById('loginModal');
                if (loginModalEl) new bootstrap.Modal(loginModalEl).show();
                return;
            }

            const calc = calculateRental();
            if (!calc) {
                alert('กรุณาเลือกวันที่เช่าให้ถูกต้อง');
                return;
            }

            const btn = document.getElementById('rentalDirectBtn');
            const originalHTML = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังส่งคำขอหาผู้ปล่อยเช่า...';

            const summaryMsg = `📅 ขอเช่าวันที่: ${calc.startVal} ถึง ${calc.endVal} (รวม ${calc.days} วัน)\n💵 ค่าเช่ารวม: ฿${calc.totalRent.toLocaleString()}\n🛡️ เงินมัดจำ: ฿${calc.deposit.toLocaleString()}\n💳 ยอดรวมที่ต้องชำระ: ฿${calc.grandTotal.toLocaleString()}`;

            if (typeof window.submitItemRequest === 'function') {
                const res = await window.submitItemRequest(item.itemId, 'rent', summaryMsg);
                if (res && res.success) {
                    modal.hide();
                    alert(`✅ ส่งคำขอนัดรับเช่า "${item.title}" สำเร็จเรียบร้อย! 🎉\nระบบได้ส่งคำขอไปยังผู้ปล่อยเช่าแล้ว สามารถตรวจสอบสถานะได้ที่เมนู "🤝 รายการนัดรับ" ครับ`);
                } else if (res && res.isDuplicate) {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    alert('⚠️ คุณเคยส่งคำขอรายการนี้ไปแล้ว! สามารถติดตามสถานะได้ที่เมนู "🤝 รายการนัดรับ" ครับ');
                } else {
                    btn.disabled = false;
                    btn.innerHTML = originalHTML;
                    alert('❌ ส่งคำขอไม่สำเร็จ: ' + (res?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'));
                }
            } else {
                btn.disabled = false;
                btn.innerHTML = originalHTML;
                alert('ระบบส่งคำขอไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ');
            }
        });
    }

    function showItemDetailModal(item) {
        const oldModal = document.getElementById('itemDetailModal');
        if (oldModal) oldModal.remove();

        const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
        const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.userId;
        const isOwner = currentUserId && String(currentUserId) === String(item.ownerId);

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

        // ปุ่มการทำรายการจะแสดงเฉพาะผู้ใช้ที่ไม่ใช่เจ้าของรายการ และสินค้าต้องพร้อมใช้งาน
        let actionButtonsHTML = '';
        const isUnavailable = item.status === 'reserved' || item.status === 'completed' || (item.quantity !== undefined && Number(item.quantity) <= 0);

        if (isOwner) {
            actionButtonsHTML = `
                <div class="alert alert-info rounded-4 p-3 mb-0 border-0 shadow-sm">
                    <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                            <span class="fw-bold"><i class="bi bi-person-badge me-1"></i> คุณคือเจ้าของรายการนี้</span>
                            <div class="small opacity-75">ผู้ใช้อื่นจะเห็นปุ่มจองเช่าและติดต่อผู้โพสต์</div>
                        </div>
                        ${item.itemType === 'rent' ? `
                            <button type="button" class="btn btn-warning rounded-pill fw-bold text-dark px-3 py-2 btn-select-option shadow-sm" data-action="rent-calendar">
                                📅 ทดสอบเปิดปฏิทินจองเช่า
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (isUnavailable) {
            actionButtonsHTML = `
                <div class="alert alert-secondary text-center rounded-4 p-3 mb-0 fw-bold fs-5 border-0 shadow-sm" style="background-color: #e9ecef; color: #495057;">
                    🔒 รายการนี้ถูกจอง หรือมีผู้ได้รับไปเรียบร้อยแล้ว
                    <div class="fs-6 opacity-75 fw-normal mt-1">ขณะนี้สินค้าหมดชั่วคราว ไม่สามารถส่งคำขอหรือทำรายการได้</div>
                </div>
            `;
        } else if (item.itemType === 'rent') {
            const depositAmt = Number(item.deposit || 0);
            actionButtonsHTML = `
                <div class="card border-0 bg-warning bg-opacity-10 rounded-4 p-3 mb-3 border border-warning shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <span class="text-dark fw-bold"><i class="bi bi-tag-fill text-warning me-1"></i> ค่าเช่า:</span>
                        <span class="fs-5 fw-bold text-dark">฿${Number(item.price).toLocaleString()} / วัน</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted small"><i class="bi bi-shield-lock-fill text-primary me-1"></i> เงินมัดจำ/ประกันสินค้า:</span>
                        <span class="fw-bold text-secondary">฿${depositAmt.toLocaleString()} <span class="small text-success fw-normal">(ได้คืนเมื่อคืนของครบ)</span></span>
                    </div>
                </div>
                <button class="btn btn-warning w-100 p-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold text-dark mb-3" 
                        data-action="rent-calendar">
                    📅 เลือกวันที่และจองเช่าสินค้า
                    <div class="fs-6 opacity-75 fw-normal mt-1">คำนวณวันและยอดรวมผ่านปฏิทิน เลือกนัดรับหรือผ่านคนกลางได้</div>
                </button>
                <button class="btn btn-outline-primary w-100 p-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        data-action="direct">
                    💬 แชตพูดคุยกับผู้ปล่อยเช่า
                    <div class="fs-6 opacity-75 fw-normal mt-1">สอบถามรายละเอียดเพิ่มเติม</div>
                </button>
            `;
        } else if (item.itemType === 'free') {
            actionButtonsHTML = `
                <button class="btn btn-success w-100 p-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        style="background-color: #198754;" data-action="direct">
                    💬 แชตพูดคุยเพื่อขอรับของแจกฟรี
                    <div class="fs-6 opacity-75 fw-normal mt-1">พูดคุยสอบถามสถานที่และนัดหมายรับของกับผู้ส่งต่อโดยตรงผ่านแชต</div>
                </button>
            `;
        } else {
            actionButtonsHTML = `
                <button class="btn btn-success w-100 p-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        style="background-color: #198754;" data-action="request-options">
                    🤝 นัดรับสินค้า
                    <div class="fs-6 opacity-75 fw-normal mt-1">ส่งคำขอให้ผู้ขายยืนยันการนัดรับ</div>
                </button>
                <button class="btn btn-primary w-100 p-3 mt-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        style="background-color: #0d6efd;" data-action="escrow">
                    🛡️ ดำเนินการซื้อขาย (฿${Number(item.price).toLocaleString()}) ผ่านระบบคนกลาง
                    <div class="fs-6 opacity-75 fw-normal mt-1">ชำระเงินปลอดภัย พักเงินไว้ที่ระบบจนกว่าจะได้รับของเรียบร้อย</div>
                </button>
                <button class="btn btn-outline-primary w-100 p-3 mt-3 rounded-4 shadow-sm btn-select-option border-0 fs-5 fw-bold" 
                        data-action="direct">
                    💬 แชตพูดคุยกับผู้ขาย
                    <div class="fs-6 opacity-75 fw-normal mt-1">สอบถามรายละเอียดเพิ่มเติม</div>
                </button>
            `;
        }

        const detailModalHTML = `
            <div class="modal fade" id="itemDetailModal" data-lat="${item.lat || ''}" data-lng="${item.lng || ''}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered" style="max-width: 720px;">
                    <div class="modal-content border-0 shadow-lg rounded-5 overflow-hidden p-3 p-md-4">
                        
                        <!-- Header -->
                        <div class="d-flex justify-content-between align-items-center pb-2">
                            <span class="badge bg-success px-3 py-2 rounded-pill fs-6 fw-bold">${item.category}</span>
                            <div>
                                <button type="button" class="btn btn-outline-danger btn-sm rounded-pill px-2 py-1 fw-bold report-item-btn d-inline-flex align-items-center gap-1 shadow-none me-2" 
                                        data-item-id="${item.itemId}" data-owner-id="${item.ownerId}" data-title="${item.title}"
                                        style="font-size: 0.8rem; white-space: nowrap;">
                                    <i class="bi bi-shield-exclamation text-danger"></i>
                                    <span>รายงาน</span>
                                </button>
                                <button type="button" class="btn-close fs-4" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                        </div>

                        <div class="modal-body p-2 p-md-3">
                            
                            <!-- 🖼️ 1. สไลด์รูปภาพสินค้าทั้งหมด (Carousel) -->
                            <div class="mb-4 position-relative">
                                <div id="itemImagesCarousel" class="carousel slide rounded-4 overflow-hidden shadow-sm" data-bs-ride="false" style="background-color: #f8f9fa;">
                                    ${item.images.length > 1 ? `
                                        <!-- ป้ายแสดงลำดับรูป (เช่น 1/5) -->
                                        <div class="position-absolute top-0 end-0 m-3 z-3">
                                            <span class="badge bg-dark bg-opacity-75 rounded-pill px-3 py-2 fs-6 shadow-sm" id="carouselSlideCounter">
                                                📸 1/${item.images.length}
                                            </span>
                                        </div>
                                    ` : ''}

                                    <div class="carousel-inner" style="min-height: 280px; max-height: 440px;">
                                        ${item.images.map((imgSrc, idx) => `
                                            <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                                                <img src="${imgSrc}" class="d-block w-100" style="max-height: 440px; min-height: 280px; object-fit: contain; background-color: #f8f9fa;" alt="${item.title} รูปที่ ${idx + 1}">
                                            </div>
                                        `).join('')}
                                    </div>

                                    ${item.images.length > 1 ? `
                                        <!-- ปุ่มเลื่อนซ้าย / ขวา -->
                                        <button class="carousel-control-prev" type="button" data-bs-target="#itemImagesCarousel" data-bs-slide="prev" style="width: 15%;">
                                            <span class="carousel-control-prev-icon bg-dark bg-opacity-50 rounded-circle p-3 shadow-sm" aria-hidden="true"></span>
                                            <span class="visually-hidden">รูปก่อนหน้า</span>
                                        </button>
                                        <button class="carousel-control-next" type="button" data-bs-target="#itemImagesCarousel" data-bs-slide="next" style="width: 15%;">
                                            <span class="carousel-control-next-icon bg-dark bg-opacity-50 rounded-circle p-3 shadow-sm" aria-hidden="true"></span>
                                            <span class="visually-hidden">รูปถัดไป</span>
                                        </button>
                                    ` : ''}
                                </div>

                                <!-- แถบรูปย่อ (Thumbnails) ให้กดเลือกรูปได้โดยตรง -->
                                ${item.images.length > 1 ? `
                                    <div class="d-flex gap-2 overflow-auto py-2 mt-2 justify-content-center" id="carouselThumbnailsBar">
                                        ${item.images.map((imgSrc, idx) => `
                                            <img src="${imgSrc}" class="img-thumbnail detail-thumb-btn ${idx === 0 ? 'border-success border-2 shadow-sm' : 'opacity-75'}" 
                                                 style="width: 72px; height: 72px; object-fit: cover; cursor: pointer; border-radius: 12px; transition: all 0.2s;" 
                                                 data-slide-index="${idx}" alt="รูปที่ ${idx + 1}">
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>

                            <!-- 📝 2. รายละเอียดสินค้าอยู่ตรงกลาง -->
                            <div class="bg-light p-4 rounded-4 mb-4 border">
                                <h2 class="fw-bold text-success mb-2">${item.title}</h2>
                                ${item.ownerName ? `
                                    <div class="d-flex align-items-center gap-2 mb-2">
                                        <span class="fw-bold text-dark fs-6">👤 ${item.ownerName}</span>
                                        <span class="badge rounded-pill text-white" style="background-color: #6f42c1;">Lv.${item.ownerLevel}</span>
                                        <span class="text-warning fw-bold fs-6">⭐ ${item.ownerRating}</span>
                                    </div>
                                `: ''}
                                <p class="text-muted fs-6 mb-3">📍 ${item.location} ${item.distance ? `<span class="text-success fw-semibold">(${item.distance})</span>`: ''}</p>
                                
<!-- Map section in detail -->
<div class="mt-4 mb-4" id="detailMapSection" style="display: ${item.lat && item.lng ? 'block' : 'none'};" data-lat="${item.lat || ''}" data-lng="${item.lng || ''}">
    <h5 class="fw-bold text-success mb-2"><i class="bi bi-geo-alt-fill me-2"></i>จุดแจกของ / นัดรับ:</h5>
    <div id="itemDetailMap" style="height: 200px; width: 100%; border-radius: 8px; border: 1px solid #ced4da;"></div>
</div>
<hr class="my-3">
<h5 class="fw-bold text-dark mb-2">รายละเอียดสินค้า:</h5>
                                <p class="text-secondary fs-5 mb-0" style="line-height: 1.6; white-space: pre-line;">${item.description}</p>
                            </div>

                            ${isOwner ? `
                                <!-- 👤 3. แผงควบคุมสำหรับเจ้าของรายการ (ปิดการสั่งซื้อสินค้าตนเอง) -->
                                <div id="itemDetailActionContainer">
                                    <div class="card border-0 bg-success bg-opacity-10 rounded-4 p-3 mb-3 border border-success shadow-sm">
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center shadow-sm" style="width: 44px; height: 44px; min-width: 44px;">
                                                <i class="bi bi-person-check-fill fs-5"></i>
                                            </div>
                                            <div>
                                                <h6 class="fw-bold text-success mb-1">📦 นี่คือรายการประกาศของคุณเอง</h6>
                                                <div class="small text-muted">คุณกำลังดูตัวอย่างประกาศของคุณ ผู้ใช้คนอื่นจะเห็นปุ่มสั่งซื้อ/ขอรับตามปกติ (ระบบปิดการสั่งซื้อสำหรับเจ้าของรายการ)</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex flex-wrap gap-2">
                                        <button type="button" class="btn btn-outline-primary rounded-pill px-3 py-2 flex-grow-1 fw-bold item-modal-edit-btn" data-item-id="${item.itemId}">
                                            ✏️ แก้ไขประกาศนี้
                                        </button>
                                        <button type="button" class="btn btn-outline-success rounded-pill px-3 py-2 flex-grow-1 fw-bold item-modal-requests-btn" data-item-id="${item.itemId}">
                                            📋 ดูรายการคำขอ ${item.pending_requests > 0 ? `<span class="badge rounded-pill bg-danger ms-1">${item.pending_requests}</span>` : ''}
                                        </button>
                                        <button type="button" class="btn btn-outline-dark rounded-pill px-3 py-2 flex-grow-1 fw-bold item-modal-chat-btn" data-item-id="${item.itemId}">
                                            💬 แชตกับผู้สนใจ
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <!-- 🛒 3. รูปแบบการซื้อขายอยู่ล่างสุด สำหรับผู้ใช้ทั่วไป -->
                                <div id="itemDetailActionContainer">
                                    ${!isUnavailable ? '<h5 class="fw-bold text-dark mb-3">เลือกลักษณะการทำรายการ:</h5>': ''}
                                    ${actionButtonsHTML}
                                </div>
                            `}

                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailModalHTML);

        const modalEl = document.getElementById('itemDetailModal');
        modalEl.addEventListener('shown.bs.modal', () => {
            const mapSec = document.getElementById('detailMapSection');
            if (!mapSec || mapSec.style.display === 'none') return;
            
            const lat = parseFloat(mapSec.dataset.lat);
            const lng = parseFloat(mapSec.dataset.lng);
            if (isNaN(lat) || isNaN(lng)) return;
            
            if (window.detailMap) {
                window.detailMap.remove(); // Destroy old map instance to detach from old DOM
                window.detailMap = null;
            }
            const googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Maps'
            });
            const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Maps'
            });

            window.detailMap = L.map('itemDetailMap', {
                layers: [googleRoadmap]
            }).setView([lat, lng], 15);

            L.control.layers({
                '🗺️ แผนที่': googleRoadmap,
                '🛰️ ดาวเทียม': googleHybrid
            }, null, { position: 'topright' }).addTo(window.detailMap);

            window.detailMarker = L.marker([lat, lng]).addTo(window.detailMap);
            setTimeout(() => { window.detailMap.invalidateSize(); }, 200);
        });

        const detailModal = new bootstrap.Modal(document.getElementById('itemDetailModal'));
        detailModal.show();

        modalEl.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.item-modal-edit-btn');
            const reqBtn = e.target.closest('.item-modal-requests-btn');
            const chatBtn = e.target.closest('.item-modal-chat-btn');

            if (editBtn) {
                detailModal.hide();
                const card = document.querySelector(`.item-element[data-item-id="${item.itemId}"]`);
                if (card) {
                    const cardEdit = card.querySelector('.item-edit-btn');
                    if (cardEdit) { cardEdit.click(); return; }
                }
                if (typeof window.showEditModal === 'function') {
                    window.showEditModal({
                        itemId: item.itemId,
                        title: item.title,
                        category: item.category,
                        itemType: item.itemType,
                        price: item.price,
                        quantity: item.quantity,
                        location: item.location,
                        description: item.description,
                        latitude: item.lat,
                        longitude: item.lng
                    });
                }
            } else if (reqBtn) {
                detailModal.hide();
                const card = document.querySelector(`.item-element[data-item-id="${item.itemId}"]`);
                if (card) {
                    const cardReq = card.querySelector('.item-requests-btn');
                    if (cardReq) cardReq.click();
                }
            } else if (chatBtn) {
                detailModal.hide();
                if (typeof window.openItemMessages === 'function') {
                    window.openItemMessages(item.itemId, item.title);
                }
            }
        });

        function showModalNotice(type, title, message) {
            document.getElementById('modalNoticeContainer')?.remove();
            const alertClass = type === 'success' ? 'alert-success' : (type === 'warning' ? 'alert-warning' : 'alert-danger');
            const icon = type === 'success' ? 'bi-check-circle-fill' : (type === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-x-circle-fill');
            const html = `
                <div id="modalNoticeContainer" class="alert ${alertClass} alert-dismissible fade show rounded-4 shadow-sm mb-3 border-0" role="alert">
                    <div class="d-flex align-items-center">
                        <i class="bi ${icon} fs-3 me-3"></i>
                        <div>
                            <h6 class="fw-bold mb-0">${title}</h6>
                            <small class="mb-0 opacity-90">${message}</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
            `;
            const actionContainer = document.getElementById('itemDetailActionContainer');
            if (actionContainer) {
                actionContainer.insertAdjacentHTML('afterbegin', html);
            }
        }

        // ควบคุมการเลื่อนรูปภาพ (Carousel) และอัปเดตตัวนับ / รูปย่อ
        const carouselEl = document.getElementById('itemImagesCarousel');
        if (carouselEl && typeof bootstrap !== 'undefined') {
            const carouselInstance = bootstrap.Carousel.getOrCreateInstance(carouselEl, { interval: false, wrap: true });
            
            // เมื่อเลื่อนเปลี่ยนรูป ให้อัปเดตตัวเลข 📸 X/Y และไฮไลต์รูปย่อ
            carouselEl.addEventListener('slid.bs.carousel', (e) => {
                const activeIndex = e.to;
                const counter = document.getElementById('carouselSlideCounter');
                if (counter) counter.textContent = `📸 ${activeIndex + 1}/${item.images.length}`;

                document.querySelectorAll('#carouselThumbnailsBar .detail-thumb-btn').forEach((thumb, idx) => {
                    if (idx === activeIndex) {
                        thumb.classList.add('border-success', 'border-2', 'shadow-sm');
                        thumb.classList.remove('opacity-75');
                    } else {
                        thumb.classList.remove('border-success', 'border-2', 'shadow-sm');
                        thumb.classList.add('opacity-75');
                    }
                });
            });

            // เมื่อคลิกที่รูปย่อ ให้เลื่อนไปยังรูปนั้นทันที
            document.querySelectorAll('#carouselThumbnailsBar .detail-thumb-btn').forEach(thumb => {
                thumb.addEventListener('click', (e) => {
                    const slideIdx = parseInt(e.currentTarget.dataset.slideIndex, 10);
                    if (!isNaN(slideIdx)) {
                        carouselInstance.to(slideIdx);
                    }
                });
            });
        }

        // ดักจับปุ่มกดเลือกการทำรายการ
        document.querySelectorAll('.btn-select-option').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget;
                const action = btn.dataset.action;

                if (action === 'request-options' && typeof window.openSubmitRequestModal === 'function') {
                    if (btn.disabled) return;
                    window.openSubmitRequestModal(item);
                } else if (action === 'request-options' && typeof window.showRequestOptions === 'function') {
                    if (btn.disabled) return;
                    btn.disabled = true;
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '⏳ กำลังส่งคำขอ...';

                    const res = await window.submitItemRequest(item.itemId, 'free');
                    if (res && res.success) {
                        btn.className = 'btn btn-secondary w-100 p-3 rounded-4 shadow-sm border-0 fs-5 fw-bold';
                        btn.style.backgroundColor = '#6c757d';
                        btn.innerHTML = '✅ ส่งคำขอเรียบร้อยแล้ว';
                        showModalNotice('success', 'ส่งคำขอสำเร็จเรียบร้อย! 🎉', 'ระบบส่งคำขอหาผู้ขายแล้ว สามารถตรวจสอบสถานะคำขอได้ที่เมนู "คำขอของฉัน" ครับ');
                    } else if (res && res.isDuplicate) {
                        btn.className = 'btn btn-secondary w-100 p-3 rounded-4 shadow-sm border-0 fs-5 fw-bold';
                        btn.style.backgroundColor = '#6c757d';
                        btn.innerHTML = '✅ เคยส่งคำขอรายการนี้แล้ว';
                        showModalNotice('warning', 'คุณเคยส่งคำขอรายการนี้ไปแล้ว! ⚠️', 'คุณได้ส่งคำขอรับสินค้านี้ไว้เรียบร้อยแล้ว สามารถติดตามสถานะได้ที่เมนู "คำขอของฉัน" ครับ');
                    } else {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                        showModalNotice('danger', 'ส่งคำขอไม่สำเร็จ', res?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
                    }
                } else if (action === 'rent-calendar') {
                    detailModal.hide();
                    openRentalBookingModal(item);
                } else if (action === 'escrow') {
                    detailModal.hide();
                    if (typeof window.startEscrowPurchase === 'function') {
                        window.startEscrowPurchase(item);
                    }
                } else if (action !== 'direct' && typeof window.submitItemRequest === 'function') {
                    detailModal.hide();
                    window.submitItemRequest(item.itemId, action);
                }
                if (action === 'direct' && typeof window.openChat === 'function') {
                    detailModal.hide();
                    window.openChat(item.ownerId, item.title, item.itemId);
                }
            });
        });
    }
});
document.addEventListener('click', (e) => {
    const reportBtn = e.target.closest('.report-item-btn');
    if (reportBtn && window.openReportModal) {
        const itemId = reportBtn.dataset.itemId;
        const ownerId = reportBtn.dataset.ownerId;
        const title = reportBtn.dataset.title;
        const detailModal = bootstrap.Modal.getInstance(document.getElementById('itemDetailModal'));
        if (detailModal) detailModal.hide();
        window.openReportModal(itemId, ownerId, `โพสต์: ${title}`);
    }
});


// ==========================================
// 🗺️ ระบบแผนที่และการปักหมุด (Leaflet Map)
// ==========================================
let addMap, addMarker;
let detailMap, detailMarker;

document.addEventListener('DOMContentLoaded', () => {
    // 1. แผนที่ตอนลงประกาศ
    const addItemModalEl = document.getElementById('postItemModal');
    if (addItemModalEl) {
        function updatePostMarker(lat, lng) {
            if (addMarker) {
                addMarker.setLatLng([lat, lng]);
            } else {
                addMarker = L.marker([lat, lng], { draggable: true }).addTo(addMap);
                addMarker.on('dragend', function () {
                    const pos = addMarker.getLatLng();
                    setPostCoordinates(pos.lat, pos.lng);
                });
            }
            setPostCoordinates(lat, lng);
        }

        function setPostCoordinates(lat, lng) {
            const itemLat = document.getElementById('itemLat');
            const itemLng = document.getElementById('itemLng');
            const display = document.getElementById('latLngDisplay');
            if (itemLat) itemLat.value = lat;
            if (itemLng) itemLng.value = lng;
            if (display) {
                display.innerText = `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}`;
                display.classList.remove('text-danger');
                display.classList.add('text-success');
            }
            // บันทึกตำแหน่งที่ปักหมุดไว้ในความจำเครื่องทันที
            if (typeof window.saveRememberedCoordinates === 'function') {
                window.saveRememberedCoordinates(lat, lng);
            }
        }

        addItemModalEl.addEventListener('shown.bs.modal', () => {
            if (!addMap) {
                // Google Maps Layers (Roadmap + Hybrid Satellite)
                const googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                    attribution: '© Google Maps'
                });
                const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                    attribution: '© Google Maps'
                });

                // ค่าเริ่มต้น: 
                // 1. ถ้ามีพิกัดที่บันทึกไว้ในเครื่อง/เคยขอ GPS -> เปิดมาที่พิกัดนั้นทันที (Zoom 15)
                // 2. ถ้าเป็นคนใหม่/คนต่างจังหวัด -> ตรวจจับอำเภอ/จังหวัดจาก IP เน็ตมือถือทันที (Zoom 13)
                // 3. ถ้าไม่มีทั้งคู่ -> ใช้พิกัดสำรอง
                let initialLat = 16.245;
                let initialLng = 103.250;
                let initialZoom = 13;
                const remembered = typeof window.getRememberedCoordinates === 'function' ? window.getRememberedCoordinates() : window.currentUserCoordinates;
                if (remembered && remembered.latitude) {
                    initialLat = remembered.latitude;
                    initialLng = remembered.longitude;
                    initialZoom = 15;
                } else {
                    const cachedIp = JSON.parse(localStorage.getItem('pankan_ip_location') || 'null');
                    const ipLoc = window.approximateIpLocation || cachedIp;
                    if (ipLoc && ipLoc.latitude && ipLoc.longitude) {
                        initialLat = ipLoc.latitude;
                        initialLng = ipLoc.longitude;
                        initialZoom = 13;
                    }
                }

                addMap = L.map('addItemMap', {
                    layers: [googleRoadmap]
                }).setView([initialLat, initialLng], initialZoom);

                // เพิ่มสวิตช์เลือกรูปแบบแผนที่ (แผนที่ถนน vs ภาพดาวเทียม)
                L.control.layers({
                    '🗺️ แผนที่ถนน': googleRoadmap,
                    '🛰️ ภาพดาวเทียม': googleHybrid
                }, null, { position: 'topright' }).addTo(addMap);

                // ปักหมุดเมื่อคลิกบนแผนที่
                addMap.on('click', (e) => {
                    updatePostMarker(e.latlng.lat, e.latlng.lng);
                });

                // หากยังไม่มีการปักหมุด และ IP location เพิ่งโหลดเสร็จ ให้เลื่อนไปยังจังหวัดของผู้ใช้
                if (!remembered && typeof window.getIpLocation === 'function') {
                    window.getIpLocation().then(freshIp => {
                        if (freshIp && freshIp.latitude && !addMarker && addMap) {
                            addMap.setView([freshIp.latitude, freshIp.longitude], 13);
                        }
                    }).catch(() => {});
                }
            } else {
                addMap.invalidateSize();
            }
        });

        // ปุ่ม "🎯 ใช้ตำแหน่งปัจจุบันของฉัน"
        const btnUseLocation = document.getElementById('btnUseCurrentLocation');
        if (btnUseLocation) {
            btnUseLocation.addEventListener('click', async (e) => {
                e.preventDefault();
                const origHtml = btnUseLocation.innerHTML;
                btnUseLocation.disabled = true;
                btnUseLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status"></span>กำลังขอพิกัด...';

                try {
                    let coords = null;
                    if (typeof window.requestUserLocation === 'function') {
                        coords = await window.requestUserLocation();
                    } else if (navigator.geolocation) {
                        coords = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(
                                pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                                reject,
                                { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
                            );
                        });
                    }

                    if (coords && coords.latitude && coords.longitude) {
                        const lat = coords.latitude;
                        const lng = coords.longitude;
                        if (addMap) {
                            addMap.setView([lat, lng], 16);
                            updatePostMarker(lat, lng);
                        }
                        if (typeof window.saveRememberedCoordinates === 'function') {
                            window.saveRememberedCoordinates(lat, lng);
                        }
                        if (typeof window.updateAllItemDistances === 'function') {
                            window.updateAllItemDistances(lat, lng);
                        }
                        btnUseLocation.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>จำตำแหน่งแล้ว';
                        btnUseLocation.classList.replace('btn-outline-success', 'btn-success');
                        setTimeout(() => {
                            btnUseLocation.innerHTML = origHtml;
                            btnUseLocation.classList.replace('btn-success', 'btn-outline-success');
                            btnUseLocation.disabled = false;
                        }, 2500);
                        return;
                    } else {
                        throw new Error('ไม่พบพิกัด');
                    }
                } catch (err) {
                    console.warn('Geolocation error:', err);
                    const remembered = typeof window.getRememberedCoordinates === 'function' ? window.getRememberedCoordinates() : null;

                    if (remembered && remembered.latitude && remembered.longitude) {
                        // หากดึงสดไม่ได้แต่เคยจำไว้ ให้ใช้ตำแหน่งเดิมทันที
                        if (addMap) {
                            addMap.setView([remembered.latitude, remembered.longitude], 16);
                            updatePostMarker(remembered.latitude, remembered.longitude);
                        }
                        btnUseLocation.innerHTML = '<i class="bi bi-clock-history me-1"></i>ใช้ตำแหน่งที่จำไว้';
                        btnUseLocation.classList.replace('btn-outline-success', 'btn-info');
                        btnUseLocation.classList.add('text-white');
                        setTimeout(() => {
                            btnUseLocation.innerHTML = origHtml;
                            btnUseLocation.classList.replace('btn-info', 'btn-outline-success');
                            btnUseLocation.classList.remove('text-white');
                            btnUseLocation.disabled = false;
                        }, 2500);
                        alert('📍 เบราว์เซอร์ยังไม่ได้เปิด GPS ระบบจึงนำ "ตำแหน่งล่าสุดที่คุณเคยบันทึกไว้" มาปักหมุดให้เรียบร้อยแล้วครับ (คุณสามารถคลิกหรือลากหมุดเพื่อปรับเปลี่ยนได้ตามต้องการ)');
                        return;
                    }

                    // หากยังไม่เคยบันทึก และเบราว์เซอร์บล็อกสิทธิ์
                    if (err && err.code === 1 /* PERMISSION_DENIED */) {
                        alert('⚠️ คุณได้ปิดกั้นการเข้าถึงตำแหน่งในเบราว์เซอร์ไว้\n\n📌 วิธีเปิดอนุญาตตำแหน่ง:\n- บน iPhone (Safari): แตะไอคอน aA หรือ 🔒 ที่มุมซ้ายล่างของแถบ URL > การตั้งค่าเว็บไซต์ > ตำแหน่งที่ตั้ง > เลือก "อนุญาต"\n- บน Android (Chrome): แตะไอคอน 🔒 หรือ ⚙️ ข้างแถบ URL ด้านบน > สิทธิ์ > เปิดสวิตช์ "ตำแหน่ง"\n\n👉 หรือสามารถคลิก/ลากหมุดบนแผนที่ได้โดยตรง ระบบจะจำตำแหน่งไว้ให้ทันทีครับ');
                    } else {
                        alert('⚠️ ไม่สามารถรับสัญญาณ GPS ได้ในขณะนี้\n\n👉 คุณสามารถคลิกหรือลากหมุดบนแผนที่ด้านล่างเพื่อระบุตำแหน่งได้ทันที และระบบจะจำตำแหน่งนี้ไว้ให้อัตโนมัติครับ');
                    }
                } finally {
                    btnUseLocation.disabled = false;
                    if (btnUseLocation.innerHTML.includes('กำลังขอพิกัด')) {
                        btnUseLocation.innerHTML = origHtml;
                    }
                }
            });
        }
        
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (currentPage >= data.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'inline-block';
            }
        }
        
        // Reset form handling
        addItemModalEl.addEventListener('hidden.bs.modal', () => {
            const itemLat = document.getElementById('itemLat');
            const itemLng = document.getElementById('itemLng');
            const latLngDisplay = document.getElementById('latLngDisplay');
            if (itemLat) itemLat.value = '';
            if (itemLng) itemLng.value = '';
            if (latLngDisplay) {
                latLngDisplay.innerText = 'ยังไม่ได้เลือก';
                latLngDisplay.classList.add('text-danger');
                latLngDisplay.classList.remove('text-success');
            }
            if (addMarker && addMap) {
                addMap.removeLayer(addMarker);
                addMarker = null;
            }
        });
    }

    // 2. แผนที่ตอนดูรายละเอียด
    
});

// สูตรคำนวณระยะทาง
window.calculateDistance = function(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
};
