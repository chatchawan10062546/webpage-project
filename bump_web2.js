const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/itemManagement.js\?v=\d+/, 'js/itemManagement.js?v=' + Date.now());
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
