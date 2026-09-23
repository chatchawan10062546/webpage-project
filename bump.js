const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/profile.js?v=6', 'js/profile.js?v=7');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
