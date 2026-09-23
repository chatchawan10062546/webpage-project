const fs = require('fs');

// Fix auth.js
let authContent = fs.readFileSync('js/auth.js', 'utf8');
const authGuards = `

// Auth Guards for interactive elements
window.handlePostItemClick = function(event) {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนลงประกาศแจกของครับ');
        window.openLoginModal();
    } else {
        window.openPostItemModal();
    }
};

window.handleChatClick = function(event) {
    event.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนดูข้อความครับ');
        window.openLoginModal();
    } else {
        window.location.href = 'chat.html';
    }
};
`;
if (!authContent.includes('handlePostItemClick')) {
    authContent += authGuards;
    fs.writeFileSync('js/auth.js', authContent, 'utf8');
}

// Re-apply removal of http://localhost:3000 to all JS files
const files = fs.readdirSync('js').filter(f => f.endsWith('.js')).map(f => 'js/' + f);
files.push('routes/itemRoutes.js');

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        let newContent = content.replace(/http:\/\/localhost:3000/g, '');
        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
        }
    }
}
