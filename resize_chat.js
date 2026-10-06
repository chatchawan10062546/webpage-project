const fs = require('fs');
let c = fs.readFileSync('js/chat.js', 'utf8');

c = c.replace('<div class="modal-dialog modal-dialog-centered">', '<div class="modal-dialog modal-dialog-centered modal-lg">');
c = c.replace('<div id="chatMessages" class="border rounded p-3 mb-3" style="height: 280px; overflow-y: auto;"></div>', '<div id="chatMessages" class="border rounded p-3 mb-3 bg-white" style="height: 450px; overflow-y: auto; scroll-behavior: smooth;"></div>');

// Let's also make the image preview inside the chat larger
c = c.replace('style="max-height: 200px; cursor: pointer;"', 'style="max-height: 300px; cursor: pointer; object-fit: contain;"');

fs.writeFileSync('js/chat.js', c, 'utf8');
console.log('Increased chat modal size');
