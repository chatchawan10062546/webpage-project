const fs = require('fs');
let c = fs.readFileSync('js/location.js', 'utf8');

const replacement = `const distanceStr = calculateDistance(userLat, userLng, itemLat, itemLng);
        const distanceVal = distanceStr.includes('เมตร') ? parseInt(distanceStr) / 1000 : parseFloat(distanceStr);
        distanceElement.textContent = \`ห่างจากคุณ \${distanceStr}\`;
        card.dataset.distanceKm = distanceVal;
        if (detailButton) detailButton.dataset.distance = distanceStr;
`;
c = c.replace(/const distance = calculateDistance\(userLat, userLng, itemLat, itemLng\);\s*distanceElement\.textContent = `ห่างจากคุณ \$\{distance\}`;\s*if \(detailButton\) detailButton\.dataset\.distance = distance;/, replacement);

fs.writeFileSync('js/location.js', c, 'utf8');
console.log('Fixed js/location.js to set distanceKm');
