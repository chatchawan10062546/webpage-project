const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

const search = `            <a class="dropdown-item" href="#" id="profileOpenBtn"><i class="bi bi-person me-2"></i>\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19</a>\r\n                    </li>\r\n                    ${user.role === 'admin'`;
const replace = `            <a class="dropdown-item" href="#" id="profileOpenBtn"><i class="bi bi-person me-2"></i>\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19</a>\r\n                    </li>\r\n                    <li>\r\n                        <a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E09\u0E31\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28</a>\r\n                    </li>\r\n                    ${user.role === 'admin'`;

if (c.includes(search)) {
    c = c.replace(search, replace);
    fs.writeFileSync('js/userProfile.js', c, 'utf8');
    console.log('Added myListingsOpenBtn successfully');
} else {
    console.log('Search string not found, trying different newline');
    const s2 = `            <a class="dropdown-item" href="#" id="profileOpenBtn"><i class="bi bi-person me-2"></i>\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19</a>\n                    </li>\n                    \${user.role === 'admin'`;
    if (c.includes(s2)) {
        const r2 = `            <a class="dropdown-item" href="#" id="profileOpenBtn"><i class="bi bi-person me-2"></i>\u0E42\u0E1B\u0E23\u0E44\u0E1F\u0E25\u0E4C\u0E02\u0E2D\u0E07\u0E09\u0E31\u0E19</a>\n                    </li>\n                    <li>\n                        <a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23\u0E17\u0E35\u0E48\u0E09\u0E31\u0E19\u0E1B\u0E23\u0E30\u0E01\u0E32\u0E28</a>\n                    </li>\n                    \${user.role === 'admin'`;
        c = c.replace(s2, r2);
        fs.writeFileSync('js/userProfile.js', c, 'utf8');
        console.log('Added with LF');
    } else {
        console.log('Failed');
    }
}
