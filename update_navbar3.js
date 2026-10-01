const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');

c = c.replace(
    '<div class="container-fluid px-4 px-xl-5" style="max-width: 1600px;">',
    '<div class="container">'
);

c = c.replace(
    '<ul class="navbar-nav ms-auto gap-3 align-items-center">',
    '<ul class="navbar-nav ms-auto gap-4 align-items-center">'
);

fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Reverted to container and gap-4');
