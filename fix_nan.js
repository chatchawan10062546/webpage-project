const fs = require('fs');
let c = fs.readFileSync('js/location.js', 'utf8');

c = c.replace(/const itemLat = Number\(card.dataset.latitude\);/, "const itemLat = card.dataset.latitude ? Number(card.dataset.latitude) : NaN;");
c = c.replace(/const itemLng = Number\(card.dataset.longitude\);/, "const itemLng = card.dataset.longitude ? Number(card.dataset.longitude) : NaN;");

fs.writeFileSync('js/location.js', c, 'utf8');
console.log('Fixed js/location.js NaN logic');
