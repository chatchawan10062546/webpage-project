const fs = require('fs');
let code = fs.readFileSync('js/transactions.js', 'utf8');

const regexBtn = /actionBtn = `<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="\$\{t\.trans_id\}">✅ ยืนยันได้รับสินค้าแล้ว<\/button>`;/;
const replacementBtn = 'actionBtn = `<button class="btn btn-sm btn-outline-success mt-2 confirm-receive-btn" data-id="${t.trans_id}" data-item-id="${t.item_id}" data-item-title="${escapeHtml(t.title)}" data-seller-id="${t.giver_id}" data-seller-name="${escapeHtml(t.seller_name)}">✅ ยืนยันได้รับสินค้าแล้ว</button>`;';
code = code.replace(regexBtn, replacementBtn);

const regexConfirm = /const tId = e\.target\.dataset\.id;\s*if\(!confirm\('ยืนยันว่าคุณได้รับสินค้าชิ้นนี้เรียบร้อยแล้วใช่หรือไม่\? \(เมื่อยืนยันแล้ว แอดมินจะทำการโอนเงินให้ผู้ขาย\)'\)\) return;\s*try \{\s*const res = await requestJson\(`\/api\/transactions\/\$\{tId\}\/confirm`, \{ method: 'POST' \}\);\s*alert\('✅ ยืนยันรับสินค้าสำเร็จ! ขอบคุณที่ใช้บริการ'\);\s*modal\.hide\(\);\s*window\.openMyTransactionsModal\(\);\s*\/\/ reload\s*\} catch\(err\) \{/
const replacementConfirm = `const target = e.target;
                    const tId = target.dataset.id;
                    const itemId = target.dataset.itemId;
                    const sellerId = target.dataset.sellerId;
                    const sellerName = target.dataset.sellerName;
                    const itemTitle = target.dataset.itemTitle;

                    if(!confirm('ยืนยันว่าคุณได้รับสินค้าชิ้นนี้เรียบร้อยแล้วใช่หรือไม่? (เมื่อยืนยันแล้ว แอดมินจะทำการโอนเงินให้ผู้ขาย)')) return;
                    
                    try {
                        const res = await requestJson(\`/api/transactions/\${tId}/confirm\`, { method: 'POST' });
                        alert('✅ ยืนยันรับสินค้าสำเร็จ! ขอบคุณที่ใช้บริการ');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload

                        if (window.openReviewModal && sellerId) {
                            window.openReviewModal(itemId, sellerId, sellerName, itemTitle);
                        }
                    } catch(err) {`;
code = code.replace(regexConfirm, replacementConfirm);

fs.writeFileSync('js/transactions.js', code);
console.log('Modified js/transactions.js');
