const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const regex = /<div class="d-flex align-items-center gap-3 mb-4">[\s\S]*?<\/div>\s*<\/div>/;
const newHtml = '<div class="text-center mb-4">\n    <img src="${item.images?.[0] || \'https://via.placeholder.com/600x300\'}" class="w-100 rounded-4 object-fit-cover shadow-sm mb-3" style="height: 250px;" alt="">\n    <h4 class="fw-bold mb-1">${item.title}</h4>\n    <div class="text-success fw-bold fs-2">฿${Number(amount).toLocaleString()}</div>\n</div>';

c = c.replace(regex, newHtml);
fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Fixed using pure string');
