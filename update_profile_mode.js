const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8');

c = c.replace('async function showProfile() {', 'async function showProfile(viewMode = "profile") {');
c = c.replace('<h5 class="modal-title fw-bold">👤 โปรไฟล์ของฉัน</h5>', '<h5 class="modal-title fw-bold">${viewMode === "profile" ? "👤 โปรไฟล์ของฉัน" : "📦 รายการที่ฉันประกาศ"}</h5>');

const xpBlockStart = '<div class="card border-0 shadow-sm rounded-4 p-3 mb-4 text-white"';
c = c.replace(xpBlockStart, '${viewMode === "profile" ? `\n                                <div class="card border-0 shadow-sm rounded-4 p-3 mb-4 text-white"');

const formEnd = '</form>';
c = c.replace(formEnd, '</form>\n                                ` : ""}');

const reviewStart = '<div>\n                                    <div class="fw-bold mb-2"><i class="bi bi-star-fill text-warning me-2"></i>ความคิดเห็น';
c = c.replace(reviewStart, '${viewMode === "profile" ? `\n                                <div>\n                                    <div class="fw-bold mb-2"><i class="bi bi-star-fill text-warning me-2"></i>ความคิดเห็น');

const reviewEnd = '<div class="reviews-list border p-3 rounded-4 bg-light">${reviewsHTML}</div>\n                                </div>';
c = c.replace(reviewEnd, '<div class="reviews-list border p-3 rounded-4 bg-light">${reviewsHTML}</div>\n                                </div>\n                                ` : ""}');

c = c.replace("document.getElementById('profileForm').addEventListener('submit', async event => {", "const pForm = document.getElementById('profileForm');\n            if (pForm) pForm.addEventListener('submit', async event => {");

c = c.replace("profileButton.addEventListener('click', event => {\r\n        event.preventDefault();\r\n        showProfile();\r\n    });", "profileButton.addEventListener('click', event => {\r\n        event.preventDefault();\r\n        showProfile('profile');\r\n    });");

c = c.replace("myListingsBtn.addEventListener('click', event => {\r\n            event.preventDefault();\r\n            showProfile().then(() => {\r\n                setTimeout(() => {\r\n                    const section = document.querySelector('#profileModal .my-items-section, #profileModal [data-section=\"items\"]');\r\n                    if (section) section.scrollIntoView({ behavior: 'smooth' });\r\n                }, 400);\r\n            }).catch(() => {});\r\n        });", "myListingsBtn.addEventListener('click', event => {\r\n            event.preventDefault();\r\n            showProfile('listings');\r\n        });");

fs.writeFileSync('js/profile.js', c, 'utf8');
console.log('Modified profile.js');
