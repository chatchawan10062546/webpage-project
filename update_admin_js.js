const fs = require('fs');
let aj = fs.readFileSync('js/admin.js', 'utf8');

// 1. Change button text
aj = aj.replace('❌ ลบทิ้ง</button>', '❌ ไม่อนุมัติ</button>');

// 2. Change logic
const oldLogic = `} else if (rejectBtn) {
            if (!confirm('ยืนยันที่จะลบโพสต์สินค้านี้ใช่หรือไม่?')) return;
            rejectBtn.disabled = true;
            try {
                await requestJson(\`/api/admin/items/\${rejectBtn.dataset.itemId}/reject\`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' }
                });
                alert('ลบโพสต์สำเร็จ');
                loadDashboard();
            } catch (error) {
                rejectBtn.disabled = false;
                alert(error.message);
            }
        }`;

const newLogic = `} else if (rejectBtn) {
            const reason = prompt('กรุณาระบุเหตุผลที่ไม่อนุมัติโพสต์นี้ (ผู้โพสต์จะเห็นข้อความนี้):');
            if (reason === null) return; // User clicked cancel
            
            rejectBtn.disabled = true;
            try {
                await requestJson(\`/api/admin/items/\${rejectBtn.dataset.itemId}/reject\`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: reason })
                });
                alert('ไม่อนุมัติโพสต์สำเร็จ');
                loadDashboard();
            } catch (error) {
                rejectBtn.disabled = false;
                alert(error.message);
            }
        }`;

if (aj.includes("if (!confirm('ยืนยันที่จะลบโพสต์สินค้านี้ใช่หรือไม่?')) return;")) {
    aj = aj.replace(oldLogic, newLogic);
    fs.writeFileSync('js/admin.js', aj, 'utf8');
    console.log('Updated admin.js');
} else {
    console.log('Could not find old logic in admin.js');
}
