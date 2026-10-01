const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');
c = c.replace(
    "name: result.profile.name, phone: result.profile.phone",
    "name: result.profile.name, phone: result.profile.phone, promptpay_number: result.profile.promptpay_number, promptpay_name: result.profile.promptpay_name"
);
fs.writeFileSync('js/profile.js', c, 'utf8');
console.log('Fixed localStorage update in profile.js');
