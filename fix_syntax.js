const fs = require('fs');
let lines = fs.readFileSync('routes/chatRoutes.js', 'utf8').split('\n');

// Keep up to line 132 (index 131), and skip lines 133-147 (index 132-146)
const newLines = [...lines.slice(0, 132), ...lines.slice(148)];
fs.writeFileSync('routes/chatRoutes.js', newLines.join('\n'), 'utf8');
console.log('Fixed chatRoutes syntax');
