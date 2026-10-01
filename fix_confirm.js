const fs = require('fs');
let c = fs.readFileSync('routes/transactionRoutes.js', 'utf8');

c = c.replace(
    "WHERE trans_id = ? AND receiver_id = ? AND status = 'shipped' AND payment_status = 'held'",
    "WHERE trans_id = ? AND receiver_id = ? AND status IN ('paid', 'shipped') AND payment_status = 'held'"
);

fs.writeFileSync('routes/transactionRoutes.js', c, 'utf8');
console.log('Fixed /confirm condition');
