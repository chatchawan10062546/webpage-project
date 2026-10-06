const fs = require('fs');
let code = fs.readFileSync('js/main.js', 'utf8');
code = code.replace(/applyFilters\(\);/g, `if (typeof window.loadItemsFromDB === 'function') window.loadItemsFromDB(); else applyFilters();`);
fs.writeFileSync('js/main.js', code);
console.log('Modified main.js');
