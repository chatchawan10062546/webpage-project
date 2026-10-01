const fs = require('fs');
let lines = fs.readFileSync('js/transactions.js', 'utf8').split('\n');

const newScript = `        document.getElementById('mockPayButton').addEventListener('click', async event => {
            const slipInput = document.getElementById('slipUpload');
            if (!slipInput.files || slipInput.files.length === 0) {
                alert('⚠️ กรุณาแนบรูปสลิปหลักฐานการโอนเงินก่อนยืนยันครับ');
                return;
            }

            event.target.disabled = true;
            event.target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังอัปโหลด...';

            try {
                const result = await requestJson(\`/api/transactions/\${transactionId}/pay\`, { method: 'POST' });
                event.target.outerHTML = \`<div class="alert alert-success mb-0">\${result.message}</div>\`;
                setTimeout(() => { modal.hide(); }, 2000);
            } catch (error) {
                event.target.disabled = false;
                event.target.innerHTML = 'ยืนยันการชำระเงิน และอัปโหลดสลิป';
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });`;

lines.splice(63, 9, newScript);
fs.writeFileSync('js/transactions.js', lines.join('\n'), 'utf8');
console.log('Fixed script lines');
