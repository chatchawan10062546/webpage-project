const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const calcDistIdx = c.indexOf('window.calculateDistance = function');
if (calcDistIdx !== -1) {
    const calcDistEnd = c.indexOf('};', calcDistIdx) + 2;
    // We want to keep everything up to calcDistEnd, and remove any garbage after it.
    c = c.substring(0, calcDistEnd) + '\n';
    fs.writeFileSync('js/item.js', c, 'utf8');
    console.log('Cleaned up garbage at end of item.js');
}
