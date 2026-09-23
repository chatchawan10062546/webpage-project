const fs = require('fs');
let c = fs.readFileSync('routes/adminRoutes.js', 'utf8');

c = c.replace(
    'SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.quantity, i.status,',
    'SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.quantity, i.status, i.is_edited,'
);

c = c.replace(
    'UPDATE items SET is_approved = TRUE WHERE item_id = ?',
    'UPDATE items SET is_approved = TRUE, is_edited = FALSE WHERE item_id = ?'
);

fs.writeFileSync('routes/adminRoutes.js', c, 'utf8');
console.log('Fixed adminRoutes');
