const fs = require('fs');
let c = fs.readFileSync('profile.html', 'utf8');
c = c.replace(/js\/itemManagement.js\?v=\d+/, 'js/itemManagement.js?v=' + Date.now());
if (!c.includes('?v=')) {
    c = c.replace('js/itemManagement.js', 'js/itemManagement.js?v=' + Date.now());
}
fs.writeFileSync('profile.html', c, 'utf8');
console.log('Bumped cache profile.html');
