const fs = require('fs');
let code = fs.readFileSync('js/item.js', 'utf8');

const searchRegex = /let category = document\.querySelector\('\.filter-btn\.active'\)\?\.getAttribute\('data-filter'\) \|\| '';\s*if \(category === 'all'\) category = '';/;
const newSearch = `const category = document.getElementById('categoryFilter')?.value || '';`;

code = code.replace(searchRegex, newSearch);
fs.writeFileSync('js/item.js', code);
console.log('Modified js/item.js');
