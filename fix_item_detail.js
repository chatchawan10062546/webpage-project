const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const targetDetail = '<div class="mt-4">\r\n                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>';
const mapHtmlDetail = `
                                <!-- Map section in detail -->
                                <div class="mt-4" id="detailMapSection" style="display: \${item.lat && item.lng ? 'block' : 'none'};" data-lat="\${item.lat || ''}" data-lng="\${item.lng || ''}">
                                    <h6 class="fw-bold text-success"><i class="bi bi-geo-alt-fill me-2"></i>จุดแจกของ / นัดรับ</h6>
                                    <div id="itemDetailMap" style="height: 200px; width: 100%; border-radius: 8px; border: 1px solid #ced4da;"></div>
                                </div>
                                
                                <div class="mt-4">
                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>`;

if (c.indexOf('id="itemDetailMap"') === -1) {
    if (c.indexOf(targetDetail) !== -1) {
        c = c.replace(targetDetail, mapHtmlDetail);
    } else {
        const targetDetailLF = '<div class="mt-4">\n                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>';
        c = c.replace(targetDetailLF, mapHtmlDetail);
    }
    fs.writeFileSync('js/item.js', c, 'utf8');
    console.log('Fixed js/item.js detail modal HTML');
} else {
    console.log('Already has detail map HTML in item.js');
}
