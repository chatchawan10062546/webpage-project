const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

c = c.replace(/const { title, category, item_type, price, quantity, details, lat, lng } = req.body;/, "const { title, category, item_type, price, quantity, details, latitude, longitude } = req.body;\n   const lat = latitude || null;\n   const lng = longitude || null;");

if (c.indexOf('latitude, longitude') !== -1) {
    fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
    console.log('Fixed req.body names');
} else {
    console.log('Failed');
}
