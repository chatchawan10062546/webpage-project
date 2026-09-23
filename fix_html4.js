const fs = require('fs');
const lines = fs.readFileSync('webpage.html', 'utf8').split(/\r?\n/);
const insertIdx = lines.findIndex(l => l.includes('อื่นๆ')) + 2;

const distanceHtml = `
                    <div class="vr my-2 text-muted opacity-25"></div>
                    <div class="dropdown">
                        <button
                            class="btn btn-link text-decoration-none text-secondary px-3 py-2 d-flex align-items-center gap-2 shadow-none border-0"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 0.95rem;" data-bs-auto-close="outside">
                            <span id="distanceSliderLabel">ทุกระยะ</span>
                            <i class="bi bi-geo-alt-fill text-success"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow mt-2 p-3" style="width: 250px;">
                            <label class="form-label text-success fw-bold small mb-1">ระยะทางที่ต้องการ (กม.)</label>
                            <input type="range" class="form-range" id="distanceSlider" min="1" max="51" value="51">
                            <div class="text-center mt-3">
                                <button class="btn btn-sm btn-outline-success rounded-pill w-100 fw-bold" id="updateLocationBtn">
                                    📍 อัปเดตพิกัดของคุณ
                                </button>
                            </div>
                        </div>
                    </div>`;

lines.splice(insertIdx, 0, distanceHtml);
let newContent = lines.join('\n');

if (!newContent.includes('js/location.js')) {
    newContent = newContent.replace('<script src="js/modals.js?v=3"></script>', '<script src="js/modals.js?v=3"></script>\n    <script src="js/location.js?v=4"></script>');
}
fs.writeFileSync('webpage.html', newContent, 'utf8');
