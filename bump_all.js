const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/modals.js\?v=\d+/, 'js/modals.js?v=' + Date.now());
c = c.replace(/js\/item.js\?v=\d+/, 'js/item.js?v=' + Date.now());
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache for modals and items');
