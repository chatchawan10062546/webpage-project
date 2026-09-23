const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const target = `const { title, category, description, location, latitude, longitude, item_type, price, quantity } = req.body;
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!title || !category || !user_id) {`;

const replacement = `const { title, category, description, location, item_type, price, quantity } = req.body;
   const latitude = (req.body.latitude && req.body.latitude !== 'null') ? req.body.latitude : null;
   const longitude = (req.body.longitude && req.body.longitude !== 'null') ? req.body.longitude : null;
   const user_id = req.authUser.userId;
   const { itemId } = req.params;

   if (!title || !category || !user_id) {`;

if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
    console.log('Fixed itemRoutes PUT validation');
}
