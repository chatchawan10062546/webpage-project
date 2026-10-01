const fs = require('fs');
let lines = fs.readFileSync('js/admin.js', 'utf8').split('\n');

const newLines = `    function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ'], transactions.map(t => \`<tr><td>\${escapeHtml(t.item_title)}</td><td>\${escapeHtml(t.giver_name)}</td><td>\${t.seller_promptpay ? \\\`<span class="fw-bold text-success">\${escapeHtml(t.seller_promptpay)}</span><br><small class="text-muted">\${escapeHtml(t.seller_promptpay_name || '')}</small>\\\` : '<span class="text-muted">-</span>'}</td><td>\${escapeHtml(t.receiver_name)}</td><td>฿\${Number(t.amount).toLocaleString()}</td><td><span class="badge bg-secondary">\${t.status}</span></td></tr>\`));
    }`;

lines.splice(123, 3, newLines);

fs.writeFileSync('js/admin.js', lines.join('\n'), 'utf8');
console.log('Fixed admin.js renderTransactions');
