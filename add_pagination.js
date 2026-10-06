const fs = require('fs');
let code = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const regex = /const sql = \`([\s\S]*?GROUP BY i\.item_id[\s\S]*?\$\{orderClause\})[\s\S]*?\`;\s*db\.query\(sql, params, \(err, results\) => \{/;
const replacement = `const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const countSql = \`SELECT COUNT(DISTINCT i.item_id) AS total FROM items i WHERE \${conditions.join(' AND ')}\`;
    
    db.query(countSql, params, (countErr, countResult) => {
        if (countErr) {
            console.error('Count Items Error:', countErr);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const sql = \`
           SELECT i.*, 
                  u.name AS owner_name, 
                  u.level AS owner_level, 
                  u.xp AS owner_xp,
                  COALESCE(AVG(r.rating), 0) AS owner_rating,
                  COUNT(r.review_id) AS owner_review_count,
                  (SELECT COUNT(*) FROM item_requests req WHERE req.item_id = i.item_id AND req.status = 'pending') AS pending_requests
           FROM items i
           JOIN users u ON u.user_id = i.user_id
           LEFT JOIN reviews r ON r.reviewee_id = i.user_id
           WHERE \${conditions.join(' AND ')}
           GROUP BY i.item_id
           \${orderClause}
           LIMIT ? OFFSET ?
        \`;

        const queryParams = [...params, limit, offset];
        db.query(sql, queryParams, (err, results) => {`;

code = code.replace(regex, replacement);
fs.writeFileSync('routes/itemRoutes.js', code);
console.log('Modified itemRoutes.js for Pagination');
