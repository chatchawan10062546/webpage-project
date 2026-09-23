const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

c = c.replace(
    'SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, item_type = ?, price = ?, quantity = ?',
    'SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, item_type = ?, price = ?, quantity = ?, is_approved = 0, is_edited = 1'
);

fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
console.log('Successfully updated UPDATE items SQL');
