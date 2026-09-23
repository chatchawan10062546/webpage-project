const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');
c = c.replace('<script src="js/profile.js?v=3"></script>', '<script src="js/profile.js?v=4"></script>');
fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Bumped cache');
