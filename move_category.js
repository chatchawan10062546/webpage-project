const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

// 1. Remove category dropdown from the top search bar
const topCategoryRegex = /<div class="vr my-2 text-muted opacity-25"><\/div>\s*<div class="dropdown">\s*<button[\s\S]*?id="selectedCategoryText"[\s\S]*?<\/ul>\s*<\/div>/;
code = code.replace(topCategoryRegex, '');

// 2. Add Category to the filter UI
const filterRegex = /<form id="filterForm" class="mb-4 d-flex flex-wrap gap-3 align-items-center bg-white p-3 rounded-pill shadow-sm border" style="border-color: #e2e8f0 !important;">\s*<div class="fw-bold text-success ms-2 d-none d-md-block">\s*<i class="bi bi-funnel-fill"><\/i> ตัวกรอง:\s*<\/div>\s*<div style="width: 150px; flex-grow: 1;">/;

const newFilterSection = `<form id="filterForm" class="mb-4 d-flex flex-wrap gap-3 align-items-center bg-white p-3 rounded-pill shadow-sm border" style="border-color: #e2e8f0 !important;">
            <div class="fw-bold text-success ms-2 d-none d-md-block">
                <i class="bi bi-funnel-fill"></i> ตัวกรอง:
            </div>
            
            <div style="width: 150px; flex-grow: 1;">
                <select class="form-select border-0 bg-light rounded-pill px-3" id="categoryFilter">
                    <option value="">📂 ทุกหมวดหมู่</option>
                    <option value="อาหาร">🥗 อาหาร</option>
                    <option value="เสื้อผ้า">👕 เสื้อผ้า</option>
                    <option value="ของใช้">📦 ของใช้</option>
                    <option value="อื่นๆ">✨ อื่นๆ</option>
                </select>
            </div>
            
            <div style="width: 150px; flex-grow: 1;">`;

code = code.replace(filterRegex, newFilterSection);
fs.writeFileSync('webpage.html', code);
console.log('Modified webpage.html');
