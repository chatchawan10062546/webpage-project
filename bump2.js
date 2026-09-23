const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/profile.js?v=7', 'js/profile.js?v=8');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
