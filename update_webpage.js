const fs = require('fs');
let c = fs.readFileSync('webpage.html', 'utf8');

// 1. Add Leaflet CDN
if (!c.includes('leaflet.css')) {
    c = c.replace('</head>', '    <!-- Leaflet Map -->\n    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />\n    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>\n</head>');
}

// 2. Add map to Add Item Modal
if (!c.includes('id="addItemMap"')) {
    const targetAdd = '<div class="mb-3">\r\n                            <label for="itemImage" class="form-label fw-bold">อัปโหลดรูปภาพ <span class="text-danger">*</span></label>';
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
                            <label for="itemImage" class="form-label fw-bold">อัปโหลดรูปภาพ <span class="text-danger">*</span></label>`;
    c = c.replace(targetAdd, mapHtmlAdd);
    
    // Fallback if not found with \r\n
    if (c.indexOf('id="addItemMap"') === -1) {
        const targetAddLF = '<div class="mb-3">\n                            <label for="itemImage" class="form-label fw-bold">อัปโหลดรูปภาพ <span class="text-danger">*</span></label>';
        c = c.replace(targetAddLF, mapHtmlAdd);
    }
}

// 3. Add map to Item Detail Modal
if (!c.includes('id="itemDetailMap"')) {
    const targetDetail = '<div class="mt-4">\r\n                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>';
    const mapHtmlDetail = `
                                <!-- Map section in detail -->
                                <div class="mt-4" id="detailMapSection" style="display: none;">
                                    <h6 class="fw-bold text-success"><i class="bi bi-geo-alt-fill me-2"></i>จุดแจกของ / นัดรับ</h6>
                                    <div id="itemDetailMap" style="height: 200px; width: 100%; border-radius: 8px; border: 1px solid #ced4da;"></div>
                                </div>
                                
                                <div class="mt-4">
                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>`;
    c = c.replace(targetDetail, mapHtmlDetail);
    
    // Fallback
    if (c.indexOf('id="itemDetailMap"') === -1) {
        const targetDetailLF = '<div class="mt-4">\n                                <h6 class="fw-bold text-success"><i class="bi bi-person-lines-fill me-2"></i>ข้อมูลผู้ลงประกาศ</h6>';
        c = c.replace(targetDetailLF, mapHtmlDetail);
    }
}

fs.writeFileSync('webpage.html', c, 'utf8');
console.log('webpage.html updated');
