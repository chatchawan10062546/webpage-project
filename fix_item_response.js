const fs = require('fs');
let code = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const regex = /res\.json\(\{ success: true, items: results \}\);/g;
const replacement = `res.json({ success: true, items: results, totalPages, currentPage: page });`;

code = code.replace(regex, replacement);
fs.writeFileSync('routes/itemRoutes.js', code);
console.log('Added totalPages to response');
