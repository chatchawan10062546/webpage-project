const fs = require('fs');
let c = fs.readFileSync('admin.html', 'utf8');
const i = c.indexOf('id="pendingItemsList"');
console.log(c.substring(i - 400, i + 800));
