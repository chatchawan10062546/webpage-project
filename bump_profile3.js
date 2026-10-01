const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/profile.js(\?v=\d+)?/, 'js/profile.js?v=' + Date.now());
fs.writeFileSync('webpage.html', c, 'utf8');
