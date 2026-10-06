const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

const filterHTML = `
        <div class="card mb-4 shadow-sm border-0">
            <div class="card-body">
                <form id="filterForm" class="row g-3">
                    <div class="col-md-3">
                        <input type="text" class="form-control" id="searchFilter" placeholder="ค้นหาสินค้า...">
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="categoryFilter">
                            <option value="">ทุกหมวดหมู่</option>
                            <option value="อาหาร">อาหาร</option>
                            <option value="เสื้อผ้า">เสื้อผ้า</option>
                            <option value="ของใช้">ของใช้</option>
                            <option value="หนังสือ">หนังสือ</option>
                            <option value="อุปกรณ์อิเล็กทรอนิกส์">อุปกรณ์อิเล็กทรอนิกส์</option>
                            <option value="อื่นๆ">อื่นๆ</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="typeFilter">
                            <option value="">ทุกประเภท</option>
                            <option value="free">แจกฟรี</option>
                            <option value="sell">ขาย</option>
                            <option value="rent">ให้เช่า</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <div class="input-group">
                            <input type="number" class="form-control" id="minPriceFilter" placeholder="ราคาต่ำสุด">
                            <span class="input-group-text">-</span>
                            <input type="number" class="form-control" id="maxPriceFilter" placeholder="ราคาสูงสุด">
                        </div>
                    </div>
                    <div class="col-md-2">
                        <select class="form-select" id="sortFilter">
                            <option value="newest">ใหม่ล่าสุด</option>
                            <option value="oldest">เก่าสุด</option>
                            <option value="price_asc">ราคา: ต่ำ-สูง</option>
                            <option value="price_desc">ราคา: สูง-ต่ำ</option>
                        </select>
                    </div>
                    <div class="col-12 text-end">
                        <button type="submit" class="btn btn-success"><i class="fas fa-search"></i> ค้นหา</button>
                        <button type="button" class="btn btn-secondary" id="resetFilterBtn">รีเซ็ต</button>
                    </div>
                </form>
            </div>
        </div>

        <div class="row g-4" id="itemGrid">`;

code = code.replace('<div class="row g-4" id="itemGrid">', filterHTML);
fs.writeFileSync('webpage.html', code);
console.log('Patched webpage.html');
