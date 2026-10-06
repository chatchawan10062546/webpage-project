const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

const regex = /<div class="card mb-4 shadow-sm border-0">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;

const newUI = `
        <form id="filterForm" class="mb-4 d-flex flex-wrap gap-3 align-items-center bg-white p-3 rounded-pill shadow-sm border" style="border-color: #e2e8f0 !important;">
            <div class="fw-bold text-success ms-2 d-none d-md-block">
                <i class="bi bi-funnel-fill"></i> ตัวกรอง:
            </div>
            
            <div style="width: 150px; flex-grow: 1;">
                <select class="form-select border-0 bg-light rounded-pill px-3" id="typeFilter">
                    <option value="">📦 ทุกประเภท</option>
                    <option value="free">🎁 แจกฟรี</option>
                    <option value="sell">💰 ขาย</option>
                    <option value="rent">🤝 ให้เช่า</option>
                </select>
            </div>
            
            <div class="input-group bg-light rounded-pill overflow-hidden" style="width: 280px; flex-grow: 1;">
                <span class="input-group-text border-0 bg-transparent text-muted ps-3"><i class="bi bi-tag-fill"></i></span>
                <input type="number" class="form-control border-0 bg-transparent px-1" id="minPriceFilter" placeholder="ราคาต่ำสุด">
                <span class="input-group-text border-0 bg-transparent text-muted px-1">-</span>
                <input type="number" class="form-control border-0 bg-transparent px-1" id="maxPriceFilter" placeholder="ราคาสูงสุด">
            </div>
            
            <div style="width: 180px; flex-grow: 1;">
                <select class="form-select border-0 bg-light rounded-pill px-3" id="sortFilter">
                    <option value="newest">🕒 ล่าสุด</option>
                    <option value="oldest">🕰️ เก่าสุด</option>
                    <option value="price_asc">📈 ราคาต่ำ - สูง</option>
                    <option value="price_desc">📉 ราคาสูง - ต่ำ</option>
                </select>
            </div>
            
            <div class="ms-auto d-flex gap-2">
                <button type="submit" class="btn btn-success rounded-pill px-4 shadow-sm fw-bold"><i class="bi bi-search"></i> นำไปใช้</button>
                <button type="button" class="btn btn-outline-secondary rounded-pill px-3 border-0 bg-light" id="resetFilterBtn"><i class="bi bi-arrow-counterclockwise"></i> รีเซ็ต</button>
            </div>
        </form>
`;

code = code.replace(regex, newUI.trim());
fs.writeFileSync('webpage.html', code);
console.log('UI updated');
