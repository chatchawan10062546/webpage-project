const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

const regex = /<div class="col-md-3">\s*<input type="text" class="form-control" id="searchFilter" placeholder="ค้นหาสินค้า\.\.\.">\s*<\/div>\s*<div class="col-md-2">\s*<select class="form-select" id="categoryFilter">[\s\S]*?<\/select>\s*<\/div>/;

code = code.replace(regex, '');
fs.writeFileSync('webpage.html', code);
console.log('Removed');
