const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

if (!c.includes('function escapeHtml')) {
    const hook = 'function getUserId() {';
    const insert = `function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
    }

    `;
    c = c.replace(hook, insert + hook);
    fs.writeFileSync('js/transactions.js', c, 'utf8');
    console.log('Added escapeHtml to transactions.js');
} else {
    console.log('escapeHtml already exists');
}
