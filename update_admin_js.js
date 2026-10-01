const fs = require('fs');
let c = fs.readFileSync('js/admin.js', 'utf8');

const targetRegex = /function renderTransactions\(transactions\) \{[\s\S]*?\}\)/;
const replacement = `function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ'], transactions.map(t => \`<tr><td>\${escapeHtml(t.item_title)}</td><td>\${escapeHtml(t.giver_name)}</td><td>\${t.seller_promptpay ? \`<span class="fw-bold text-success">\${escapeHtml(t.seller_promptpay)}</span><br><small class="text-muted">\${escapeHtml(t.seller_promptpay_name || '')}</small>\` : '<span class="text-muted">-</span>'}</td><td>\${escapeHtml(t.receiver_name)}</td><td>฿\${Number(t.amount).toLocaleString()}</td><td><span class="badge bg-secondary">\${t.status}</span></td></tr>\`));
    })`;

if (targetRegex.test(c)) {
    c = c.replace(targetRegex, replacement);
    fs.writeFileSync('js/admin.js', c, 'utf8');
    console.log('Updated renderTransactions in admin.js');
} else {
    console.log('Failed to match renderTransactions');
}
