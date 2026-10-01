const fs = require('fs');
let c = fs.readFileSync('js/admin.js', 'utf8');

const targetStr = `function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'ธุรกรรม', 'ชำระเงิน', 'จัดส่ง'], transactions.map(transaction => \`<tr><td>\${escapeHtml(transaction.item_title)}</td><td>\${escapeHtml(transaction.giver_name)}</td><td>\${escapeHtml(transaction.receiver_name)}</td><td>฿\${Number(transaction.amount).toLocaleString()}</td><td>\${transaction.status}</td><td>\${transaction.payment_status}</td><td>\${transaction.shipping_status}</td></tr>\`));
    }`;

const replacement = `function renderTransactions(transactions) {
        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ'], transactions.map(t => \`<tr><td>\${escapeHtml(t.item_title)}</td><td>\${escapeHtml(t.giver_name)}</td><td>\${t.seller_promptpay ? \\\`<span class="fw-bold text-success">\${escapeHtml(t.seller_promptpay)}</span><br><small class="text-muted">\${escapeHtml(t.seller_promptpay_name || '')}</small>\\\` : '<span class="text-muted">-</span>'}</td><td>\${escapeHtml(t.receiver_name)}</td><td>฿\${Number(t.amount).toLocaleString()}</td><td><span class="badge bg-secondary">\${t.status}</span></td></tr>\`));
    }`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, replacement);
    fs.writeFileSync('js/admin.js', c, 'utf8');
    console.log('Successfully updated renderTransactions');
} else {
    console.log('Could not find target string in admin.js');
}
