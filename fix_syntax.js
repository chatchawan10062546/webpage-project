const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8').split('\n');

if (c[209].trim() === '});' && c[208].trim() === '});') {
    c.splice(209, 1);
    fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
    console.log('Fixed extra });');
} else if (c[209].trim() === '});' && c[210].includes('} catch (error) {')) {
    c.splice(209, 1);
    fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
    console.log('Fixed extra }); directly above catch');
} else {
    console.log('Could not find it exactly at 209/210, let me check manually');
}
