const fs = require('fs');
let c = fs.readFileSync('routes/authRoutes.js', 'utf8');

c = c.replace(
    "role: user.role",
    "role: user.role,\n                promptpay_number: user.promptpay_number,\n                promptpay_name: user.promptpay_name"
);

fs.writeFileSync('routes/authRoutes.js', c, 'utf8');
console.log('Fixed authRoutes.js to include promptpay');
