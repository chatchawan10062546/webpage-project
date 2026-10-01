const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/main.js(\?v=\d+)?/, 'js/main.js?v=' + Date.now());
fs.writeFileSync('webpage.html', c, 'utf8');
