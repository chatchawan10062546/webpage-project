const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/profile.js?v=4', 'js/profile.js?v=5');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped profile.js to v5');
