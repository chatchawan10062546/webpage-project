const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

const regex = /<div class="row g-4" id="itemGrid">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/;
const loadMoreHTML = `
        <div class="row g-4" id="itemGrid">
            <!-- การ์ดรายการของแจก -->
        </div>

        <div class="text-center mt-5 mb-3">
            <button id="loadMoreBtn" class="btn btn-outline-success rounded-pill px-5 py-2 fw-bold" style="display: none;">
                <i class="bi bi-arrow-clockwise me-1"></i> โหลดเพิ่มเติม
            </button>
        </div>

    </div>
</section>
`;

code = code.replace(regex, loadMoreHTML);
fs.writeFileSync('webpage.html', code);
console.log('Added load more button');
