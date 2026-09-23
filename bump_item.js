const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/item.js?v=3', 'js/item.js?v=4');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
