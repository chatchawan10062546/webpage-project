const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const target = `if (!window.detailMap) {
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
            }`;

const replacement = `if (window.detailMap) {
                window.detailMap.remove(); // Destroy old map instance to detach from old DOM
                window.detailMap = null;
            }
            window.detailMap = L.map('itemDetailMap').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(window.detailMap);
            window.detailMarker = L.marker([lat, lng]).addTo(window.detailMap);
            setTimeout(() => { window.detailMap.invalidateSize(); }, 200);`;

c = c.replace(target, replacement);
fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed Leaflet map re-initialization on modal recreate');
