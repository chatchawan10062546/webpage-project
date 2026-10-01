const fs = require('fs');
let c = fs.readFileSync('admin.html', 'utf8');
c = c.replace(/js\/admin.js(\?v=\d+)?/, 'js/admin.js?v=' + Date.now());
fs.writeFileSync('admin.html', c, 'utf8');
console.log('Bumped cache for admin.html');
