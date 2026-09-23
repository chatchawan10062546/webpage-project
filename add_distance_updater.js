const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const distanceScript = `
// อัปเดตระยะทางเมื่อโหลดรายการเสร็จ
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(async () => {
        const distanceSpans = document.querySelectorAll('.item-distance');
        if (distanceSpans.length === 0) return;
        
        try {
            const pos = await new Promise((resolve, reject) => {
                if (!navigator.geolocation) reject(new Error('Geolocation not supported'));
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;
            
            document.querySelectorAll('.item-element').forEach(el => {
                const itemLat = el.dataset.latitude;
                const itemLng = el.dataset.longitude;
                const distSpan = el.querySelector('.item-distance');
                
                if (itemLat && itemLng && distSpan && window.calculateDistance) {
                    const d = window.calculateDistance(userLat, userLng, parseFloat(itemLat), parseFloat(itemLng));
                    distSpan.innerHTML = '<i class="bi bi-pin-map-fill"></i> ห่าง ' + d + ' กม.';
                } else if (distSpan) {
                    distSpan.innerText = '';
                }
            });
        } catch (err) {
            console.log('GPS error:', err);
            document.querySelectorAll('.item-distance').forEach(span => span.innerText = '');
        }
    }, 1500); // Wait for items to load
});
`;

if (!c.includes('// อัปเดตระยะทางเมื่อโหลดรายการเสร็จ')) {
    fs.writeFileSync('js/item.js', c + '\n' + distanceScript, 'utf8');
}
console.log('Added distance updater');
