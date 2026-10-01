const fs = require('fs');
let c = fs.readFileSync('routes/transactionRoutes.js', 'utf8');

c = c.replace(
    'SELECT t.trans_id, t.item_id, i.title, i.images, t.amount',
    'SELECT t.trans_id, t.item_id, i.title, i.image_url, t.amount'
);

c = c.replace(
    /const transactions = results\.map.*?return t;\n            \}\);/s,
    'const transactions = results;'
);

fs.writeFileSync('routes/transactionRoutes.js', c, 'utf8');
console.log('Fixed /transactions/me/all SQL query');
