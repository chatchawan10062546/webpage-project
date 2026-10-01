const fs = require('fs');
let c = fs.readFileSync('routes/profileRoutes.js', 'utf8');

c = c.replace(
    "profile: { user_id, name: name.trim(), phone: phone || '' }",
    "profile: { user_id, name: name.trim(), phone: phone || '', promptpay_number: promptpay_number || '', promptpay_name: promptpay_name || '' }"
);

fs.writeFileSync('routes/profileRoutes.js', c, 'utf8');
console.log('Fixed profileRoutes return value');
