const fs = require('fs');
let c = fs.readFileSync('js/location.js', 'utf8');

if (!c.includes("new Event('distancesUpdated')")) {
    c = c.replace(/}\s*$/g, "    window.dispatchEvent(new Event('distancesUpdated'));\n}\n");
    fs.writeFileSync('js/location.js', c, 'utf8');
    console.log('Added dispatchEvent to location.js');
}
