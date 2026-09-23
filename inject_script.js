const fs = require('fs');
let html = fs.readFileSync('webpage.html', 'utf8');

if (!html.includes('notifications.js')) {
    html = html.replace('</body>', '    <script src="js/notifications.js?v=1"></script>\n</body>');
    fs.writeFileSync('webpage.html', html, 'utf8');
    console.log("Injected notifications.js script tag into webpage.html");
} else {
    console.log("Already has script tag.");
}
