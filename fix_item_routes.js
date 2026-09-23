const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const target = `if (!title || !category || !user_id || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {`;
const replacement = `if (!title || !category || !user_id) {`;

if (c.includes(target)) {
    c = c.replace(target, replacement);
    
    // Also make sure we parse lat/lng nicely so we don't save "null" string to db or anything weird
    // Although in db-schema.sql they are DECIMAL. So if undefined, we should pass null.
    const latlngTarget = `const { title, category, description, location, latitude, longitude, item_type, price, quantity } = req.body;`;
    const latlngReplacement = `const { title, category, description, location, item_type, price, quantity } = req.body;
   const latitude = (req.body.latitude && req.body.latitude !== 'null') ? req.body.latitude : null;
   const longitude = (req.body.longitude && req.body.longitude !== 'null') ? req.body.longitude : null;`;
   
    c = c.replace(latlngTarget, latlngReplacement);
    fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
    console.log('Fixed itemRoutes POST validation');
}
