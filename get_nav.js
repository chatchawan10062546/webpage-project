const fs = require('fs');
const lines = fs.readFileSync('webpage.html', 'utf8').split('\n');
let start = lines.findIndex(l => l.includes('<nav'));
for(let i=start; i<start+45; i++) console.log(i+1, lines[i]);
