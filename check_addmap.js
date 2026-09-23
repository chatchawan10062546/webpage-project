const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');
const s = c.indexOf("L.map('addItemMap')");
console.log(c.substring(s - 200, s + 500));
