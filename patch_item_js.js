const fs = require('fs');
let code = fs.readFileSync('js/item.js', 'utf8');

const regex = /async function loadItemsFromDB\(\) \{[\s\S]*?const response = await fetch\('\/api\/items'\);/;

const replacement = `async function loadItemsFromDB() {
        try {
            const search = document.getElementById('searchFilter')?.value || '';
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

            const response = await fetch(\`/api/items?\${queryParams.toString()}\`);`;

code = code.replace(regex, replacement);

const eventListeners = `
    const filterForm = document.getElementById('filterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadItemsFromDB();
        });
    }
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            filterForm.reset();
            loadItemsFromDB();
        });
    }

    loadItemsFromDB();`;

code = code.replace('loadItemsFromDB();', eventListeners);

fs.writeFileSync('js/item.js', code);
console.log('Patched js/item.js');
