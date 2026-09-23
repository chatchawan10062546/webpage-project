const fs = require('fs');
let c = fs.readFileSync('js/modals.js', 'utf8');

const targetAdd = '<div class="mb-3">\r\n                                <label for="postImageFile" class="form-label fw-bold">รูปภาพสิ่งของ (เลือกได้หลายรูป)</label>';
const mapHtmlAdd = `
                            <!-- Map section for Lat/Lng -->
                            <div class="mb-3" id="mapSection">
                                <label class="form-label fw-bold">จุดแจกของ / นัดรับ (คลิกบนแผนที่เพื่อปักหมุด)</label>
                                <div id="addItemMap" style="height: 250px; width: 100%; border-radius: 8px; border: 1px solid #ced4da;"></div>
                                <input type="hidden" id="itemLat" name="lat">
                                <input type="hidden" id="itemLng" name="lng">
                                <small class="text-muted mt-1 d-block"><i class="bi bi-geo-alt-fill text-danger"></i> พิกัด: <span id="latLngDisplay">ยังไม่ได้เลือก</span></small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="postImageFile" class="form-label fw-bold">รูปภาพสิ่งของ (เลือกได้หลายรูป)</label>`;
if (c.indexOf('id="addItemMap"') === -1) {
    if (c.indexOf(targetAdd) !== -1) {
        c = c.replace(targetAdd, mapHtmlAdd);
    } else {
        const targetAddLF = '<div class="mb-3">\n                                <label for="postImageFile" class="form-label fw-bold">รูปภาพสิ่งของ (เลือกได้หลายรูป)</label>';
        c = c.replace(targetAddLF, mapHtmlAdd);
    }
    fs.writeFileSync('js/modals.js', c, 'utf8');
    console.log('Fixed js/modals.js');
} else {
    console.log('Already has map');
}
