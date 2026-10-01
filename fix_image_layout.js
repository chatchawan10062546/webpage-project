const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

c = c.replace(
    '<img src="${item.images?.[0] || \'\'}" class="transaction-item-image" alt="">',
    '<img src="${item.images?.[0] || \'https://via.placeholder.com/80\'}" class="rounded object-fit-cover shadow-sm" style="width: 80px; height: 80px;" alt="">'
);

fs.writeFileSync('js/transactions.js', c, 'utf8');
console.log('Fixed modal image layout');
