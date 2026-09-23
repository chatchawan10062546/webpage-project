const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const target = "document.body.insertAdjacentHTML('beforeend', detailModalHTML);";
const replacement = `document.body.insertAdjacentHTML('beforeend', detailModalHTML);

        const modalEl = document.getElementById('itemDetailModal');
        modalEl.addEventListener('shown.bs.modal', () => {
            const mapSec = document.getElementById('detailMapSection');
            if (!mapSec || mapSec.style.display === 'none') return;
            
            const lat = parseFloat(mapSec.dataset.lat);
            const lng = parseFloat(mapSec.dataset.lng);
            if (isNaN(lat) || isNaN(lng)) return;
            
            if (!window.detailMap) {
                window.detailMap = L.map('itemDetailMap').setView([lat, lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.detailMap);
                window.detailMarker = L.marker([lat, lng]).addTo(window.detailMap);
            } else {
                window.detailMap.setView([lat, lng], 15);
                if (window.detailMarker) {
                    window.detailMarker.setLatLng([lat, lng]);
                } else {
                    window.detailMarker = L.marker([lat, lng]).addTo(window.detailMap);
                }
                window.detailMap.invalidateSize();
            }
        });
`;

c = c.replace(target, replacement);

// And we should remove the old broken event listener at the end of the file.
c = c.replace(/const detailModalEl = document\.getElementById\('itemDetailModal'\);[\s\S]*?\}\);\s*\}/, "");

fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed detail map init');
