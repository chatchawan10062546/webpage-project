const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');

const sIdx = c.indexOf('<div class="mb-4">\r\n                                    <div class="profile-list-heading fw-bold mb-2"><i class="bi bi-box-seam text-success me-2"></i>รายการที่ฉันประกาศ');
if (sIdx !== -1) {
    let end = c.indexOf('</div>', sIdx);
    end = c.indexOf('</div>', end + 5); // closes profile-items-list
    end = c.indexOf('</div>', end + 5) + 6; // closes mb-4

    const chunk = c.substring(sIdx, end);
    c = c.replace(chunk, '${viewMode === "listings" ? `\n' + chunk + '\n` : ""}');
    fs.writeFileSync('js/profile.js', c, 'utf8');
    console.log('Fixed listings hiding in profile view');
} else {
    // Try LF only
    const sIdxLF = c.indexOf('<div class="mb-4">\n                                    <div class="profile-list-heading fw-bold mb-2"><i class="bi bi-box-seam text-success me-2"></i>รายการที่ฉันประกาศ');
    if (sIdxLF !== -1) {
        let end = c.indexOf('</div>', sIdxLF);
        end = c.indexOf('</div>', end + 5);
        end = c.indexOf('</div>', end + 5) + 6;

        const chunk = c.substring(sIdxLF, end);
        c = c.replace(chunk, '${viewMode === "listings" ? `\n' + chunk + '\n` : ""}');
        fs.writeFileSync('js/profile.js', c, 'utf8');
        console.log('Fixed listings hiding in profile view (LF)');
    } else {
        console.log('Pattern not found');
    }
}
