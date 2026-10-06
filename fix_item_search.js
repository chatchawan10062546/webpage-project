const fs = require('fs');
let code = fs.readFileSync('js/item.js', 'utf8');

const regex = /const search = document.getElementById\('searchFilter'\)\?.value \|\| '';\s*const category = document.getElementById\('categoryFilter'\)\?.value \|\| '';/;

const replacement = `const search = document.getElementById('searchInput')?.value || '';
            let category = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || '';
            if (category === 'all') category = '';`;

code = code.replace(regex, replacement);
fs.writeFileSync('js/item.js', code);
console.log('Fixed item.js');
