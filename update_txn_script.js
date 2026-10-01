const fs = require('fs');
let c = fs.readFileSync('js/transactions.js', 'utf8');

const targetScript = `document.getElementById('mockPayButton').addEventListener('click', async event => {
            event.target.disabled = true;
            try {
                const result = await requestJson(\`/api/transactions/\${transactionId}/pay\`, { method: 'POST' });
                event.target.outerHTML = \`<div class="alert alert-success mb-0">\${result.message}</div>\`;
            } catch (error) {
                event.target.disabled = false;
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });`;

const newScript = `document.getElementById('mockPayButton').addEventListener('click', async event => {
            const slipInput = document.getElementById('slipUpload');
            if (!slipInput.files || slipInput.files.length === 0) {
                alert('⚠️ กรุณาแนบรูปสลิปหลักฐานการโอนเงินก่อนยืนยันครับ');
                return;
            }

            event.target.disabled = true;
            event.target.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังอัปโหลด...';

            try {
                // สมมติว่าตอนนี้เรายังใช้ API เดิมไปก่อน (ถ้ามีอัปโหลดรูปจริงต้องเปลี่ยนเป็น FormData)
                const result = await requestJson(\`/api/transactions/\${transactionId}/pay\`, { method: 'POST' });
                event.target.outerHTML = \`<div class="alert alert-success mb-0">\${result.message}</div>\`;
                
                // ถ้ายืนยันสำเร็จ ให้ซ่อน Modal หลัง 2 วินาที
                setTimeout(() => { modal.hide(); }, 2000);
            } catch (error) {
                event.target.disabled = false;
                event.target.innerHTML = 'ยืนยันการชำระเงิน และอัปโหลดสลิป';
                alert('ชำระเงินไม่สำเร็จ: ' + error.message);
            }
        });`;

if (c.includes(targetScript)) {
    c = c.replace(targetScript, newScript);
    fs.writeFileSync('js/transactions.js', c, 'utf8');
    console.log('Updated Payment Modal Script in transactions.js');
} else {
    console.log('Failed to find mockPayButton script in transactions.js');
}
