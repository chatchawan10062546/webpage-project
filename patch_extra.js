const fs = require('fs');
let lines = fs.readFileSync('js/transactions.js', 'utf8').split('\n');
lines.splice(83, 1);
fs.writeFileSync('js/transactions.js', lines.join('\n'), 'utf8');
console.log('Fixed syntax error in transactions.js');
