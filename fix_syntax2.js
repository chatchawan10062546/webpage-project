const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8').split('\n');

if (c[217].trim() === '});' && c[216].trim() === '});') {
    c.splice(217, 1);
    fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
    console.log('Fixed extra });');
}
