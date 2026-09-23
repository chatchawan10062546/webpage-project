const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('js/userProfile.js?v=3', 'js/userProfile.js?v=4');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped userProfile.js to v4');
