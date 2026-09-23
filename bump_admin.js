const fs = require('fs');
let c = fs.readFileSync('admin.html', 'utf8');
c = c.replace(/js\/admin.js\?v=\d+/, 'js/admin.js?v=' + Date.now());
if (!c.includes('?v=')) { // Fallback if no query string was there
    c = c.replace('js/admin.js', 'js/admin.js?v=' + Date.now());
}
fs.writeFileSync('admin.html', c, 'utf8');
console.log('Cache bumped for admin.html');
