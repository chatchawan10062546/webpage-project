const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace(/css\/style.css\?v=\d+/, 'css/style.css?v=' + Date.now());
if (!c.includes('?v=')) {
    c = c.replace(/"css\/style.css"/, '"css/style.css?v=' + Date.now() + '"');
}
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache for style.css');
