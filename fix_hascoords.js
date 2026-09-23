const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

c = c.replace(/const hasCoordinates = Number.isFinite\(Number\(item.latitude \|\| item.lat\)\) && Number.isFinite\(Number\(item.longitude \|\| item.lng\)\);/g, "const latVal = item.latitude || item.lat; const lngVal = item.longitude || item.lng; const hasCoordinates = latVal !== null && latVal !== undefined && latVal !== '' && lngVal !== null && lngVal !== undefined && lngVal !== '' && Number.isFinite(Number(latVal)) && Number.isFinite(Number(lngVal));");

fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed hasCoordinates logic in item.js');
