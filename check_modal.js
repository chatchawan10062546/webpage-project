const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');
const sIdx = c.indexOf('id="itemDetailModal"');
console.log(c.substring(sIdx - 50, sIdx + 500));
