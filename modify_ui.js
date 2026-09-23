const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const searchBtn = '<button class="btn btn-outline-success btn-sm flex-grow-1 item-requests-btn" type="button">คำขอ</button>';
const replaceBtn = '<button class="btn btn-outline-success btn-sm flex-grow-1 item-requests-btn position-relative" type="button">คำขอ ${item.pending_requests > 0 ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="font-size: 0.65rem;">${item.pending_requests}</span>` : ""}</button>';

if (c.includes(searchBtn)) {
    c = c.replace(searchBtn, replaceBtn);
    fs.writeFileSync('js/item.js', c, 'utf8');
    console.log('Modified js/item.js to show pending requests badge');
} else {
    console.log('Could not find the button in js/item.js');
}
