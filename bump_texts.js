const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/itemRequests.js(\?v=\d+)?/, 'js/itemRequests.js?v=' + Date.now());
c = c.replace(/js\/userProfile.js(\?v=\d+)?/, 'js/userProfile.js?v=' + Date.now());
c = c.replace(/js\/transactions.js(\?v=\d+)?/, 'js/transactions.js?v=' + Date.now());
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
