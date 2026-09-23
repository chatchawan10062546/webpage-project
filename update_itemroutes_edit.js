const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const targetSql = `      UPDATE items
      SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, item_type = ?, price = ?, quantity = ?
   \`;`;

const replacementSql = `      UPDATE items
      SET title = ?, category = ?, description = ?, location = ?, latitude = ?, longitude = ?, item_type = ?, price = ?, quantity = ?, is_approved = 0, is_edited = 1
   \`;`;

if (c.includes(targetSql)) {
    c = c.replace(targetSql, replacementSql);
    fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
    console.log('Fixed itemRoutes PUT to set is_approved=0, is_edited=1');
}
