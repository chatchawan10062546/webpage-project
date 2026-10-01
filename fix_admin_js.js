const fs = require('fs');
let c = fs.readFileSync('js/admin.js', 'utf8').split('\n');

const renderTxIdx = c.findIndex(l => l.includes('function renderTransactions(transactions) {'));

if (renderTxIdx > -1) {
    const nextLine = renderTxIdx + 1;
    // The current line is: renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ'], transactions.map(t => ...
    c.splice(nextLine, 1, 
    "        renderTable(document.getElementById('adminTransactionsList'), ['สินค้า', 'ผู้ขาย', 'พร้อมเพย์ผู้ขาย', 'ผู้ซื้อ', 'จำนวนเงิน', 'สถานะ', 'จัดการ'], transactions.map(t => ",
    "            `<tr>",
    "                <td>${escapeHtml(t.item_title)}</td>",
    "                <td>${escapeHtml(t.giver_name)}</td>",
    "                <td>${t.seller_promptpay ? `<span class=\"fw-bold text-success\">${escapeHtml(t.seller_promptpay)}</span><br><small class=\"text-muted\">${escapeHtml(t.seller_promptpay_name || '')}</small>` : '<span class=\"text-muted\">-</span>'}</td>",
    "                <td>${escapeHtml(t.receiver_name)}</td>",
    "                <td>฿${Number(t.amount).toLocaleString()}</td>",
    "                <td><span class=\"badge bg-${t.status === 'released' ? 'warning text-dark' : t.status === 'completed' ? 'success' : 'secondary'}\">${t.status}</span></td>",
    "                <td>${t.status === 'released' ? `<button class=\"btn btn-sm btn-success complete-tx-btn\" data-id=\"${t.trans_id}\">💸 โอนเงินแล้ว</button>` : ''}</td>",
    "            </tr>`",
    "        ));"
    );

    // Also add event listener in the document click handler
    const docClickIdx = c.findIndex(l => l.includes("document.getElementById('adminViewPendingItems').addEventListener('click'"));
    if (docClickIdx > -1) {
        c.splice(docClickIdx, 0, 
            "    document.getElementById('adminTransactionsList').addEventListener('click', async event => {",
            "        if (event.target.classList.contains('complete-tx-btn')) {",
            "            if (!confirm('ยืนยันว่าได้ทำการโอนเงินเข้าบัญชีพร้อมเพย์ของผู้ขายแล้วใช่หรือไม่?')) return;",
            "            const txId = event.target.dataset.id;",
            "            try {",
            "                await requestJson(`/api/admin/transactions/${txId}/complete`, { method: 'PATCH' });",
            "                alert('บันทึกการโอนเงินสำเร็จ');",
            "                loadView('transactions');",
            "            } catch (error) {",
            "                alert(error.message);",
            "            }",
            "        }",
            "    });",
            ""
        );
    }
    
    fs.writeFileSync('js/admin.js', c.join('\n'), 'utf8');
    console.log('Fixed js/admin.js');
}
