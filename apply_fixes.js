const fs = require('fs');

// 1. Fix webpage.html
let htmlContent = fs.readFileSync('webpage.html', 'utf8');
htmlContent = htmlContent.replace('id="chatNavLink" onclick="handleChatClick(event)">แชตข้อความ', 'id="chatNavLink">แชตข้อความ');
fs.writeFileSync('webpage.html', htmlContent, 'utf8');

// 2. Fix js/auth.js
let authContent = fs.readFileSync('js/auth.js', 'utf8');
// Remove the old broken handleChatClick and fix handlePostItemClick
const newAuthGuards = `// Auth Guards for interactive elements
window.handlePostItemClick = function(event) {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนลงประกาศแจกของครับ');
        window.openLoginModal();
    } else {
        const postModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('postItemModal'));
        postModal.show();
    }
};
`;

// Use regex to replace the Auth Guards section at the end of the file
authContent = authContent.replace(/\/\/ Auth Guards for interactive elements[\s\S]*/, newAuthGuards);
fs.writeFileSync('js/auth.js', authContent, 'utf8');

console.log('Fixes applied successfully.');
