const fs = require('fs');
let content = fs.readFileSync('webpage.html', 'utf8');

const regex = /<!-- ค้นหาและกรอง -->[\s\S]*?อัปเดตพิกัด\s*<\/button>\s*<\/div>\s*<\/div>/;

const newSearch = `                <!-- ค้นหาและกรอง -->
                <div class="row gx-3 mb-4 mt-2 align-items-center">
                    <!-- ช่องค้นหา -->
                    <div class="col-md-7 mb-3 mb-md-0">
                        <div class="input-group input-group-lg shadow-sm">
                            <span class="input-group-text bg-white border-end-0 text-muted"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control border-start-0 ps-0" id="searchInput" placeholder="ค้นหาของที่อยากได้...">
                        </div>
                    </div>
                    <!-- ปุ่มอัปเดตตำแหน่ง -->
                    <div class="col-md-2 mb-3 mb-md-0">
                        <button class="btn btn-outline-success btn-lg w-100 shadow-sm px-2 text-nowrap" id="updateLocationBtn" style="font-size: 0.95rem;">
                            <i class="bi bi-geo-alt-fill"></i> พิกัด
                        </button>
                    </div>
                    <!-- Slider ระยะทาง -->
                    <div class="col-md-3 d-flex align-items-center bg-white rounded-3 shadow-sm px-3 py-2 border">
                        <div class="w-100">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                                <span class="text-secondary text-nowrap" style="font-size: 0.85rem;"><i class="bi bi-geo-alt-fill text-success me-1"></i>ระยะทาง:</span>
                                <span id="distanceSliderLabel" class="fw-bold text-success text-end text-nowrap" style="font-size: 0.85rem; width: 85px;">ทุกระยะ</span>
                            </div>
                            <input type="range" class="form-range" id="distanceSlider" min="1" max="51" value="51" style="height: 0.5rem;">
                        </div>
                    </div>
                </div>`;
content = content.replace(regex, newSearch);

if (!content.includes('js/location.js')) {
    content = content.replace('<script src="js/modals.js?v=3"></script>', '<script src="js/modals.js?v=3"></script>\n    <script src="js/location.js?v=4"></script>');
}
fs.writeFileSync('webpage.html', content, 'utf8');
