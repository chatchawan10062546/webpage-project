const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

c = c.replace(/Number\(item\.latitude\)/g, "Number(item.latitude || item.lat)");
c = c.replace(/Number\(item\.longitude\)/g, "Number(item.longitude || item.lng)");

c = c.replace(/data-latitude="\$\{hasCoordinates \? item\.latitude : ''\}"/, "data-latitude=\"${hasCoordinates ? (item.latitude || item.lat) : ''}\"");
c = c.replace(/data-longitude="\$\{hasCoordinates \? item\.longitude : ''\}"/, "data-longitude=\"${hasCoordinates ? (item.longitude || item.lng) : ''}\"");

fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed item lat/lng logic in renderItemCard');
