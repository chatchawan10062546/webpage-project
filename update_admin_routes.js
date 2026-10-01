const fs = require('fs');
let c = fs.readFileSync('routes/adminRoutes.js', 'utf8');

c = c.replace(
    /g\.name AS giver_name, r\.name AS receiver_name, t\.created_at/,
    "g.name AS giver_name, r.name AS receiver_name, g.promptpay_number AS seller_promptpay, g.promptpay_name AS seller_promptpay_name, t.created_at"
);

fs.writeFileSync('routes/adminRoutes.js', c, 'utf8');
console.log('Updated adminRoutes.js for transactions');
