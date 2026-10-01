const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');

// Replace the navbar container
c = c.replace(
    '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\r\n        <div class="container">',
    '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\r\n        <div class="container-fluid px-4 px-xl-5">'
);
c = c.replace(
    '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\n        <div class="container">',
    '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\n        <div class="container-fluid px-4 px-xl-5">'
);

// Increase gap from gap-2 to gap-3
c = c.replace(
    '<ul class="navbar-nav ms-auto gap-2 align-items-center">',
    '<ul class="navbar-nav ms-auto gap-3 align-items-center">'
);

fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Updated navbar layout');
