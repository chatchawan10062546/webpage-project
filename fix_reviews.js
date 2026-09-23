const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');

const sIdx = c.indexOf('<div class="fw-bold mb-2"><i class="bi bi-star-fill text-warning me-2"></i>ความคิดเห็นและรีวิวจากผู้ใช้อื่น');
if (sIdx !== -1) {
    const start = c.lastIndexOf('<div>', sIdx);
    // Find the end of <div class="reviews-list...">...</div>\n</div>
    let end = c.indexOf('</div>', sIdx);
    end = c.indexOf('</div>', end + 5); // closes the reviews-list div
    end = c.indexOf('</div>', end + 5) + 6; // closes the wrapper div

    const chunk = c.substring(start, end);
    c = c.replace(chunk, '${viewMode === "profile" ? `\n' + chunk + '\n` : ""}');
    fs.writeFileSync('js/profile.js', c, 'utf8');
    console.log('Fixed reviews hiding');
} else {
    console.log('Pattern not found');
}
