const fs = require('fs');
let c = fs.readFileSync('js/modals.js', 'utf8');

const mapTarget = `<!-- Map section for Lat/Lng -->
                            <div class="mb-3" id="mapSection">`;
const toggleHtml = `<!-- Toggle for Map Privacy -->
                            <div class="mb-3 bg-light p-3 rounded-4 border">
                                <div class="form-check form-switch fs-5 mb-0">
                                    <input class="form-check-input" type="checkbox" id="showMapToggle" checked style="cursor: pointer;">
                                    <label class="form-check-label fw-bold ms-2 text-success" for="showMapToggle" style="cursor: pointer;">📍 แชร์พิกัดสถานที่นัดรับบนแผนที่</label>
                                </div>
                                <div class="form-text mt-1 text-muted"><i class="bi bi-info-circle"></i> ปิดสวิตช์นี้ได้หากไม่สะดวกเปิดเผยพิกัดที่อยู่อาศัย (เหมาะสำหรับซื้อขายหรือให้เช่า)</div>
                            </div>
                            
                            <!-- Map section for Lat/Lng -->
                            <div class="mb-3" id="mapSection">`;

if (!c.includes('id="showMapToggle"')) {
    c = c.replace(mapTarget, toggleHtml);
}

const eventTarget = `// ซ่อน/แสดง ช่องระบุราคา
    document.addEventListener('change', (e) => {`;
const eventReplacement = `// ซ่อน/แสดง ช่องระบุราคาและแผนที่
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'showMapToggle') {
            const mapSec = document.getElementById('mapSection');
            if (mapSec) {
                mapSec.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked && typeof window.addMap !== 'undefined' && window.addMap) {
                    setTimeout(() => window.addMap.invalidateSize(), 200);
                }
            }
        }`;

if (!c.includes("e.target.id === 'showMapToggle'")) {
    c = c.replace(eventTarget, eventReplacement);
}

fs.writeFileSync('js/modals.js', c, 'utf8');
console.log('Updated modals.js with map toggle');
