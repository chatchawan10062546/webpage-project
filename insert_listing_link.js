const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

const insertAfter = 'profileOpenBtn';
const idx = c.indexOf(insertAfter);
if (idx === -1) { console.log('not found'); process.exit(1); }

// Find the </li> after profileOpenBtn
const liEnd = c.indexOf('</li>', idx);
if (liEnd === -1) { console.log('no </li>'); process.exit(1); }

const insertPos = liEnd + 5; // after </li>
const newItem = '\r\n                    <li>\r\n                        <a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>รายการที่ฉันประกาศ</a>\r\n                    </li>';

c = c.slice(0, insertPos) + newItem + c.slice(insertPos);
fs.writeFileSync('js/userProfile.js', c, 'utf8');
console.log('Done! Inserted myListingsOpenBtn at position', insertPos);

