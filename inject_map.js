const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const mapHTML = `
<!-- Map section in detail -->
<div class="mt-4 mb-4" id="detailMapSection" style="display: \${item.lat && item.lng ? 'block' : 'none'};" data-lat="\${item.lat || ''}" data-lng="\${item.lng || ''}">
    <h5 class="fw-bold text-success mb-2"><i class="bi bi-geo-alt-fill me-2"></i>จุดแจกของ / นัดรับ:</h5>
    <div id="itemDetailMap" style="height: 200px; width: 100%; border-radius: 8px; border: 1px solid #ced4da;"></div>
</div>
<hr class="my-3">
`;

// Replace the first <hr class="my-3"> after location
c = c.replace(/<hr class="my-3">\s*<h5 class="fw-bold text-dark mb-2">รายละเอียดสินค้า:<\/h5>/, mapHTML + '<h5 class="fw-bold text-dark mb-2">รายละเอียดสินค้า:</h5>');

fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Injected map HTML into detail modal');
