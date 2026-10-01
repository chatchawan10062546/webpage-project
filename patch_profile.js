const fs = require('fs');
let c = fs.readFileSync('js/userProfile.js', 'utf8');

c = c.replace(
    '<a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>รายการที่ฉันประกาศ</a>\n                    </li>',
    '<a class="dropdown-item" href="#" id="myListingsOpenBtn"><i class="bi bi-box-seam me-2"></i>รายการที่ฉันประกาศ</a>\n                    </li>\n                    <li>\n                        <a class="dropdown-item" href="#" id="myTransactionsOpenBtn"><i class="bi bi-bag-check me-2"></i>ประวัติการซื้อขาย</a>\n                    </li>'
);

fs.writeFileSync('js/userProfile.js', c, 'utf8');
console.log('Added myTransactionsOpenBtn to userProfile.js');
