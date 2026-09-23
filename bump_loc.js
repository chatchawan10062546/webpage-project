const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/js\/location.js\?v=\d+/, 'js/location.js?v=' + Date.now());
if (!c.includes('?v=')) {
    c = c.replace(/"js\/location.js"/, '"js/location.js?v=' + Date.now() + '"');
}
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache for location');
