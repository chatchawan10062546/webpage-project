const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

c = c.replace(
    '<img src="${item.images?.[0] || \'https://via.placeholder.com/80\'}" class="rounded object-fit-cover shadow-sm" style="width: 80px; height: 80px;" alt="">',
    '<img src="${item.images?.[0] || \'https://via.placeholder.com/140\'}" class="rounded-4 object-fit-cover shadow-sm" style="width: 140px; height: 140px;" alt="">'
);
c = c.replace(
    '<div><div class="fw-bold">${item.title}</div><div class="text-success fw-bold fs-4">฿${Number(amount).toLocaleString()}</div></div>',
    '<div><div class="fw-bold fs-5 mb-1">${item.title}</div><div class="text-success fw-bold fs-3">฿${Number(amount).toLocaleString()}</div></div>'
);

fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Increased image size and adjusted text size');
