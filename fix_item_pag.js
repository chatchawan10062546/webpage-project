const fs = require('fs');
let code = fs.readFileSync('js/item.js', 'utf8');

const regex = /window\.loadItemsFromDB = async function loadItemsFromDB\(\) \{[\s\S]*?const data = await response\.json\(\);/;

const replacement = `
    let currentPage = 1;
    window.loadItemsFromDB = async function loadItemsFromDB(append = false) {
        if (!append) currentPage = 1;

        try {
            const search = document.getElementById('searchInput')?.value || '';
            const category = document.getElementById('categoryFilter')?.value || '';
            const type = document.getElementById('typeFilter')?.value || '';
            const min_price = document.getElementById('minPriceFilter')?.value || '';
            const max_price = document.getElementById('maxPriceFilter')?.value || '';
            const sort = document.getElementById('sortFilter')?.value || 'newest';

            const queryParams = new URLSearchParams();
            if (search) queryParams.append('search', search);
            if (category) queryParams.append('category', category);
            if (type) queryParams.append('type', type);
            if (min_price) queryParams.append('min_price', min_price);
            if (max_price) queryParams.append('max_price', max_price);
            if (sort) queryParams.append('sort', sort);
            queryParams.append('page', currentPage);
            queryParams.append('limit', 12);

            const response = await fetch(\`/api/items?\${queryParams.toString()}\`);
            const data = await response.json();`;

code = code.replace(regex, replacement);

const innerRegex = /if \(data\.success && itemGrid\) \{\s*itemGrid\.innerHTML = ''; \/\/ ล้างข้อมูลเก่าออกก่อนแสดงผลใหม่/;
const innerRep = `if (data.success && itemGrid) {
                if (!append) itemGrid.innerHTML = '';`;

code = code.replace(innerRegex, innerRep);

const btnRegex = /const filterForm = document\.getElementById\('filterForm'\);/;
const btnRep = `
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentPage++;
            window.loadItemsFromDB(true);
        });
    }

    const filterForm = document.getElementById('filterForm');`;
code = code.replace(btnRegex, btnRep);

const hideBtnRegex = /\/\/ Reset form handling/;
const hideBtnRep = `
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (currentPage >= data.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'inline-block';
            }
        }
        
        // Reset form handling`;
code = code.replace(hideBtnRegex, hideBtnRep);

fs.writeFileSync('js/item.js', code);
console.log('Modified item.js for pagination');
