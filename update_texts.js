const fs = require('fs');

// 1. Update webpage.html
let html = fs.readFileSync('webpage.html', 'utf8');
html = html.replace('>คำขอของฉัน</a>', '>รายการนัดรับ / ขอของฟรี</a>');
fs.writeFileSync('webpage.html', html, 'utf8');

// 2. Update js/itemRequests.js
let itemReq = fs.readFileSync('js/itemRequests.js', 'utf8');
itemReq = itemReq.replace('คำขอของฉัน (My Requests)', 'รายการนัดรับ / ขอของฟรี');
fs.writeFileSync('js/itemRequests.js', itemReq, 'utf8');

// 3. Update js/userProfile.js
let profile = fs.readFileSync('js/userProfile.js', 'utf8');
profile = profile.replace('>ประวัติการซื้อขาย</a>', '>ประวัติซื้อขาย (คนกลาง)</a>');
fs.writeFileSync('js/userProfile.js', profile, 'utf8');

// 4. Update js/transactions.js
let txn = fs.readFileSync('js/transactions.js', 'utf8');
txn = txn.replace('ประวัติการซื้อขาย</h5>', 'ประวัติซื้อขาย (คนกลาง)</h5>');
fs.writeFileSync('js/transactions.js', txn, 'utf8');

console.log('Updated texts for Option 1');
