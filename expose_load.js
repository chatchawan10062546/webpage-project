const fs = require('fs');
let code = fs.readFileSync('js/item.js', 'utf8');
code = code.replace(/async function loadItemsFromDB\(\) \{/, 'window.loadItemsFromDB = async function loadItemsFromDB() {');
fs.writeFileSync('js/item.js', code);
console.log('Exposed loadItemsFromDB');
