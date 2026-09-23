const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');
c = c.replace(/getElementById\('addItemModal'\)/g, "getElementById('postItemModal')");
fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed postItemModal ID');
