const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

const before = c.length;

// Remove the <li> block for คำขอของฉัน
const regex = /\s*<li>\s*\n?\s*<a class="dropdown-item" href="#" id="myRequestsOpenBtn"><i class="bi bi-send me-2"><\/i>[^<]+<\/a>\s*\n?\s*<\/li>/;
c = c.replace(regex, '');

if (c.length < before) {
    fs.writeFileSync('js/userProfile.js', c, 'utf8');
    console.log('Removed คำขอของฉัน from dropdown');
} else {
    console.log('Regex did not match - trying line-based approach');
    const lines = c.split('\n');
    const filtered = lines.filter((l, i) => {
        return !(l.includes('myRequestsOpenBtn') || (lines[i-1] && lines[i-1].includes('myRequestsOpenBtn')) || (lines[i+1] && lines[i+1].includes('myRequestsOpenBtn')));
    });
    // Remove surrounding <li></li> manually
    const result = [];
    for (let i = 0; i < filtered.length; i++) {
        if (filtered[i].includes('<li>') && filtered[i+1] && filtered[i+1].includes('myRequestsOpenBtn')) {
            i += 2; // skip li + a + /li
        } else {
            result.push(filtered[i]);
        }
    }
    fs.writeFileSync('js/userProfile.js', result.join('\n'), 'utf8');
    console.log('Removed via line filter');
}
