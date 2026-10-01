const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');

c = c.replace(
    '<div class="container-fluid px-4 px-xl-5">',
    '<div class="container-fluid px-4 px-xl-5" style="max-width: 1600px;">'
);

fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Added max-width 1600px to navbar container');
