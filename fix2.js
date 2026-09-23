const fs = require('fs');
let c = fs.readFileSync('js/itemManagement.js', 'utf8');

c = c.replace(
    /<div class="mb-3">\s*<label for="editPrice"/g,
    '<div class="mb-3" id="editPriceContainer">\n                                    <label for="editPrice"'
);

fs.writeFileSync('js/itemManagement.js', c, 'utf8');
console.log('Fixed editPriceContainer');
