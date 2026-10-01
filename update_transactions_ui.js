const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8').split('\n');

const openModalStart = c.findIndex(l => l.includes('window.openMyTransactionsModal = async () => {'));
if (openModalStart > -1) {
    const actionBtnLine = c.findIndex((l, i) => i > openModalStart && l.includes('let actionBtn ='));
    
    // Replace the actionBtn logic
    if (actionBtnLine > -1) {
        // Find where the actionBtn logic block ends (before return `)
        let returnLine = actionBtnLine;
        while (!c[returnLine].includes('return `')) {
            returnLine++;
        }
        
        const newLogic = [
            "                let actionBtn = '';",
            "                if (isBuyer && (t.status === 'paid' || t.status === 'shipped')) {",
            "                    actionBtn = `<button class=\"btn btn-sm btn-outline-success mt-2 confirm-receive-btn\" data-id=\"${t.trans_id}\">✅ ยืนยันได้รับสินค้าแล้ว</button>`;",
            "                } else if (!isBuyer && t.status === 'paid') {",
            "                    actionBtn = `<button class=\"btn btn-sm btn-primary mt-2 ship-item-btn\" data-id=\"${t.trans_id}\">📦 แจ้งจัดส่งสินค้า</button>`;",
            "                }"
        ].join('\n');
        
        c.splice(actionBtnLine, returnLine - actionBtnLine, newLogic);
    }
}
fs.writeFileSync('js/transactions.js', c.join('\n'), 'utf8');
console.log('Added ship-item-btn logic');
