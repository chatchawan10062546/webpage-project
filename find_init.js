const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const sIdx = c.indexOf('const detailModal = new bootstrap.Modal(document.getElementById(\'itemDetailModal\'));');
console.log(c.substring(sIdx - 100, sIdx + 100));
