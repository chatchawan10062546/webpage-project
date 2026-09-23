const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

// POST /api/items
c = c.replace(/const { title, category, item_type, price, quantity, details } = req.body;/, "const { title, category, item_type, price, quantity, details, lat, lng } = req.body;");
c = c.replace(/INSERT INTO items \(title, category, item_type, price, quantity, details, image_url, user_id\)/, "INSERT INTO items (title, category, item_type, price, quantity, details, image_url, user_id, lat, lng)");
c = c.replace(/VALUES \(\?, \?, \?, \?, \?, \?, \?, \?\)/, "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
c = c.replace(/\[title, category, item_type, parsedPrice, parsedQuantity, details, imageUrl, userId\]/, "[title, category, item_type, parsedPrice, parsedQuantity, details, imageUrl, userId, lat || null, lng || null]");

// SELECT in GET /api/items
c = c.replace(/SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.quantity, i.status, i.image_url/g, "SELECT i.item_id, i.title, i.category, i.item_type, i.price, i.quantity, i.status, i.image_url, i.lat, i.lng");

// Check if successful
fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
console.log('Updated itemRoutes.js');
