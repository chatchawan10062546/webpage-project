const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');
const target = `    if (userJson && localStorage.getItem('authToken')) {
        const user = JSON.parse(userJson);`;
const replacement = `    if (userJson && localStorage.getItem('authToken')) {
        const user = JSON.parse(userJson);
        // บังคับแอดมินให้อยู่หน้า admin.html
        if (user.role === 'admin' && (window.location.pathname.endsWith('webpage.html') || window.location.pathname.endsWith('/'))) {
            window.location.replace('admin.html');
            return;
        }`;
if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync('js/userProfile.js', c, 'utf8');
    console.log('Added admin redirect protection');
} else {
    console.log('Target not found in userProfile.js');
}
