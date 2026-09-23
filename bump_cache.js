const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/userProfile.js?v=4', 'js/userProfile.js?v=5');
c = c.replace('js/profile.js?v=5', 'js/profile.js?v=6');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache versions');
