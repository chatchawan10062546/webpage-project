const fs = require('fs');

const mainJsContent = `// ====================================================
// 📌 main.js: ระบบค้นหา และ กรองหมวดหมู่/ระยะทาง
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const selectedCategoryText = document.getElementById('selectedCategoryText');
    const distanceSlider = document.getElementById('distanceSlider');
    const distanceSliderLabel = document.getElementById('distanceSliderLabel');
    const updateLocationBtn = document.getElementById('updateLocationBtn');

    let currentSearch = '';
    let currentCategory = 'all';
    let currentDistance = 'all';

    function getItems() {
        return document.querySelectorAll('#itemGrid .item-element');
    }

    function applyFilters() {
        getItems().forEach(item => {
            const title = item.getAttribute('data-title') ? item.getAttribute('data-title').toLowerCase() : '';
            const category = item.getAttribute('data-category');
            const distanceKm = item.dataset.distanceKm ? Number(item.dataset.distanceKm) : null;

            const matchSearch = title.includes(currentSearch);
            const matchCategory = currentCategory === 'all' || category === currentCategory;
            const matchDistance = currentDistance === 'all' || (distanceKm !== null && distanceKm <= Number(currentDistance));

            item.style.display = (matchSearch && matchCategory && matchDistance) ? 'block' : 'none';
        });
    }

    // 1. ระบบค้นหา Real-time
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    // 2. ระบบกรองตามหมวดหมู่ Dropdown
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentCategory = btn.getAttribute('data-filter');
            if (selectedCategoryText) {
                selectedCategoryText.innerText = currentCategory === 'all' ? 'หมวดหมู่' : btn.innerText.trim();
            }
            applyFilters();
        });
    });

    // 3. ระบบกรองตามระยะทาง Slider
    if (distanceSlider) {
        distanceSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            
            // Check if user has location permission before allowing distance filter
            if (!window.currentUserCoordinates && value <= 50) {
                alert('กรุณากดปุ่ม "📍 อัปเดตพิกัด" เพื่อดึงตำแหน่งของคุณก่อนครับ');
                distanceSlider.value = 51;
                return;
            }

            if (value > 50) {
                currentDistance = 'all';
                if (distanceSliderLabel) distanceSliderLabel.innerText = 'ทุกระยะ';
            } else {
                currentDistance = value;
                if (distanceSliderLabel) distanceSliderLabel.innerText = \`ภายใน \${value} กม.\`;
            }
            applyFilters();
        });
    }

    // 4. ปุ่มขอพิกัด (Update Location)
    if (updateLocationBtn) {
        updateLocationBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            updateLocationBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังหาตำแหน่ง...';
            updateLocationBtn.disabled = true;

            try {
                // Ignore cache, force new position
                const coordinates = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(
                        position => resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            date: new Date().toISOString().slice(0, 10)
                        }),
                        () => reject(new Error('กรุณาอนุญาตการเข้าถึงตำแหน่ง')),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                });
                
                localStorage.setItem('pankanUserCoordinates', JSON.stringify(coordinates));
                window.currentUserCoordinates = coordinates;
                
                if (typeof window.updateAllItemDistances === 'function') {
                    window.updateAllItemDistances(coordinates.latitude, coordinates.longitude);
                }
                
                updateLocationBtn.innerHTML = '📍 อัปเดตพิกัดสำเร็จ';
                updateLocationBtn.classList.replace('btn-outline-primary', 'btn-success');
                setTimeout(() => {
                    updateLocationBtn.innerHTML = '📍 อัปเดตพิกัดของคุณ';
                    updateLocationBtn.classList.replace('btn-success', 'btn-outline-success');
                    updateLocationBtn.disabled = false;
                }, 3000);
            } catch (err) {
                alert(err.message);
                updateLocationBtn.innerHTML = '📍 อัปเดตพิกัดของคุณ';
                updateLocationBtn.disabled = false;
            }
        });
    }

    // เมื่อพิกัดคำนวณเสร็จ ให้กรองซ้ำอีกรอบ
    window.addEventListener('distancesUpdated', () => {
        applyFilters();
    });
});
`;

fs.writeFileSync('js/main.js', mainJsContent, 'utf8');
