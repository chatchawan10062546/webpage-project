const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');

const styleBlock = `
    <style>
        @media (min-width: 1400px) {
            .custom-nav-container {
                max-width: 100% !important;
                padding-left: calc((100vw - 1320px) / 2 + 0.75rem) !important;
                padding-right: 4rem !important;
            }
        }
        @media (min-width: 1200px) and (max-width: 1399.98px) {
            .custom-nav-container {
                max-width: 100% !important;
                padding-left: calc((100vw - 1140px) / 2 + 0.75rem) !important;
                padding-right: 2rem !important;
            }
        }
        @media (max-width: 1199.98px) {
            .custom-nav-container {
                max-width: 100% !important;
                padding-left: 1rem !important;
                padding-right: 1rem !important;
            }
        }
    </style>
</head>`;

if (!c.includes('custom-nav-container')) {
    c = c.replace('</head>', styleBlock);
    c = c.replace(
        '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\r\n        <div class="container">',
        '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\r\n        <div class="container-fluid custom-nav-container">'
    );
    c = c.replace(
        '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\n        <div class="container">',
        '<nav class="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow-sm">\n        <div class="container-fluid custom-nav-container">'
    );
}

fs.writeFileSync('webpage.html', c, 'utf8');
console.log('Applied custom nav container');
