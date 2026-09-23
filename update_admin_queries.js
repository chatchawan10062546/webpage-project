const fs = require('fs');
let c = fs.readFileSync('routes/adminRoutes.js', 'utf8');

// 1. Update /admin/summary
const searchSummary = "pendingItems: 'SELECT COUNT(*) AS total FROM items WHERE is_approved = FALSE',";
const replaceSummary = "pendingItems: \"SELECT COUNT(*) AS total FROM items WHERE is_approved = FALSE AND status != 'rejected'\",";
if (c.includes(searchSummary)) {
    c = c.replace(searchSummary, replaceSummary);
    console.log("Updated /admin/summary");
}

// 2. Update /admin/items/pending
const searchPending = "WHERE i.is_approved = FALSE\n         ORDER BY i.item_id DESC";
const replacePending = "WHERE i.is_approved = FALSE AND i.status != 'rejected'\n         ORDER BY i.item_id DESC";
if (c.includes(searchPending)) {
    c = c.replace(searchPending, replacePending);
    console.log("Updated /admin/items/pending");
}

fs.writeFileSync('routes/adminRoutes.js', c, 'utf8');
