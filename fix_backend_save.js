const fs = require('fs');
let c = fs.readFileSync('routes/profileRoutes.js', 'utf8');

c = c.replace(
    "[name.trim(), phone || '', user_id]",
    "[name.trim(), phone || '', promptpay_number || '', promptpay_name || '', user_id]"
);

fs.writeFileSync('routes/profileRoutes.js', c, 'utf8');
console.log('Fixed profileRoutes.js SQL parameters');
