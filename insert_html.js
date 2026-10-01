const fs = require('fs');
let lines = fs.readFileSync('js/userProfile.js', 'utf8').split('\n');
lines.splice(62, 0, '                    <li>\n                        <a class="dropdown-item" href="#" id="myTransactionsOpenBtn"><i class="bi bi-bag-check me-2"></i>ประวัติการซื้อขาย</a>\n                    </li>');
fs.writeFileSync('js/userProfile.js', lines.join('\n'), 'utf8');
console.log('Inserted myTransactionsOpenBtn HTML into userProfile.js');
