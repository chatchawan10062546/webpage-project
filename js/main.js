// ====================================================
// 📌 main.js: ระบบค้นหา และ กรองหมวดหมู่สิ่งของ
// ====================================================
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.item-element');
    const selectedCategoryText = document.getElementById('selectedCategoryText');

    // 1. ระบบค้นหา Real-time
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase().trim();

            items.forEach(item => {
                const title = item.getAttribute('data-title') ? item.getAttribute('data-title').toLowerCase() : '';
                item.style.display = title.includes(searchText) ? 'block' : 'none';
            });
        });
    }

    // 2. ระบบกรองตามหมวดหมู่ Dropdown
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            
            if (selectedCategoryText) {
                selectedCategoryText.innerText = filterValue === 'all' ? 'หมวดหมู่' : btn.innerText.trim();
            }

            items.forEach(item => {
                const category = item.getAttribute('data-category');
                item.style.display = (filterValue === 'all' || category === filterValue) ? 'block' : 'none';
            });
        });
    });
});