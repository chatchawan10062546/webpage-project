const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

const regex = /if \(userJson && localStorage\.getItem\('authToken'\)\) \{\s*const user = JSON\.parse\(userJson\);/;
const replacement = `if (userJson && localStorage.getItem('authToken')) {
        const user = JSON.parse(userJson);
        // บังคับแอดมินให้อยู่หน้า admin.html
        if (user.role === 'admin' && (window.location.pathname.endsWith('webpage.html') || window.location.pathname.endsWith('/'))) {
            window.location.replace('admin.html');
            return;
        }`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('js/userProfile.js', c, 'utf8');
    console.log('Added admin redirect protection using regex');
} else {
    console.log('Target not found in userProfile.js');
}
