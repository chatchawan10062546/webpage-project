const fs = require('fs');
let c = fs.readFileSync('routes/itemRoutes.js', 'utf8');
c = c.replace('COUNT(r.review_id) AS owner_review_count', 'COUNT(r.review_id) AS owner_review_count,\n              (SELECT COUNT(*) FROM item_requests req WHERE req.item_id = i.item_id AND req.status = "pending") AS pending_requests');
fs.writeFileSync('routes/itemRoutes.js', c, 'utf8');
console.log('Modified itemRoutes.js SQL');
