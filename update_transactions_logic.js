const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8').split('\n');

const confirmEndIdx = c.findIndex(l => l.includes("alert('ยืนยันไม่สำเร็จ: ' + err.message);")) + 4; // after }); });

const shipLogic = `
            // Event Listener สำหรับปุ่ม แจ้งจัดส่งสินค้า (Seller)
            modalEl.querySelectorAll('.ship-item-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const tId = e.target.dataset.id;
                    const tracking = prompt('กรุณากรอกหมายเลขพัสดุ (ถ้ามี):');
                    if(tracking === null) return; // cancelled
                    
                    try {
                        const res = await requestJson(\`/api/transactions/\${tId}/ship\`, { 
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ tracking_number: tracking })
                        });
                        alert('📦 แจ้งจัดส่งสินค้าสำเร็จ! (ระบบจะปล่อยเงินอัตโนมัติใน 2 วัน หากผู้ซื้อไม่กดยืนยัน)');
                        modal.hide();
                        window.openMyTransactionsModal(); // reload
                    } catch(err) {
                        alert('แจ้งจัดส่งไม่สำเร็จ: ' + err.message);
                    }
                });
            });
`;

c.splice(confirmEndIdx, 0, shipLogic);

fs.writeFileSync('js/transactions.js', c.join('\n'), 'utf8');
console.log('Added ship logic listener');
