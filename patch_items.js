const fs = require('fs');
let code = fs.readFileSync('routes/itemRoutes.js', 'utf8');

const regex = /router\.get\('\/items', \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, items: results \}\);\r?\n\s*\}\);\r?\n\}\);/;

const replacement = `router.get('/items', (req, res) => {
    const { category, type, min_price, max_price, sort, search } = req.query;
    let conditions = ['i.is_approved = TRUE', 'i.status != \\'completed\\''];
    let params = [];
    if (search) {
        conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
        params.push('%' + search + '%', '%' + search + '%');
    }
    if (category) {
        conditions.push('i.category = ?');
        params.push(category);
    }
    if (type) {
        conditions.push('i.item_type = ?');
        params.push(type);
    }
    if (min_price) {
        conditions.push('i.price >= ?');
        params.push(Number(min_price));
    }
    if (max_price) {
        conditions.push('i.price <= ?');
        params.push(Number(max_price));
    }
    let orderClause = 'ORDER BY i.item_id DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY i.price ASC';
    else if (sort === 'price_desc') orderClause = 'ORDER BY i.price DESC';
    else if (sort === 'oldest') orderClause = 'ORDER BY i.item_id ASC';

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
    \`;
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Fetch Items Error:', err);
            return res.status(500).json({ success: false, message: 'ดึงข้อมูลไม่สำเร็จ' });
        }
        res.json({ success: true, items: results });
    });
});`;

code = code.replace(regex, replacement);
fs.writeFileSync('routes/itemRoutes.js', code);
console.log('Patched');
