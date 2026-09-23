const fs = require('fs');

const mapScript = `
// ==========================================
// 🗺️ ระบบแผนที่และการปักหมุด (Leaflet Map)
// ==========================================
let addMap, addMarker;
let detailMap, detailMarker;

document.addEventListener('DOMContentLoaded', () => {
    // 1. แผนที่ตอนลงประกาศ
    const addItemModalEl = document.getElementById('addItemModal');
    if (addItemModalEl) {
        addItemModalEl.addEventListener('shown.bs.modal', () => {
            if (!addMap) {
                // Initialize map at a default center (เช่น มมส)
                addMap = L.map('addItemMap').setView([16.245, 103.250], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap'
                }).addTo(addMap);
                
                // Add marker on click
                addMap.on('click', (e) => {
                    if (addMarker) {
                        addMarker.setLatLng(e.latlng);
                    } else {
                        addMarker = L.marker(e.latlng).addTo(addMap);
                    }
                    document.getElementById('itemLat').value = e.latlng.lat;
                    document.getElementById('itemLng').value = e.latlng.lng;
                    document.getElementById('latLngDisplay').innerText = e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5);
                    document.getElementById('latLngDisplay').classList.remove('text-danger');
                    document.getElementById('latLngDisplay').classList.add('text-success');
                });
            } else {
                addMap.invalidateSize();
            }
        });
        
        // Reset form handling
        addItemModalEl.addEventListener('hidden.bs.modal', () => {
            document.getElementById('itemLat').value = '';
            document.getElementById('itemLng').value = '';
            document.getElementById('latLngDisplay').innerText = 'ยังไม่ได้เลือก';
            document.getElementById('latLngDisplay').classList.add('text-danger');
            document.getElementById('latLngDisplay').classList.remove('text-success');
            if (addMarker) {
                addMap.removeLayer(addMarker);
                addMarker = null;
            }
        });
    }

    // 2. แผนที่ตอนดูรายละเอียด
    const detailModalEl = document.getElementById('itemDetailModal');
    if (detailModalEl) {
        detailModalEl.addEventListener('shown.bs.modal', () => {
            const mapSec = document.getElementById('detailMapSection');
            if (!mapSec || mapSec.style.display === 'none') return; // ไม่พิกัด ไม่ต้องโชว์
            
            const lat = parseFloat(mapSec.dataset.lat);
            const lng = parseFloat(mapSec.dataset.lng);
            
            if (!detailMap) {
                detailMap = L.map('itemDetailMap').setView([lat, lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(detailMap);
                detailMarker = L.marker([lat, lng]).addTo(detailMap);
            } else {
                detailMap.setView([lat, lng], 15);
                if (detailMarker) {
                    detailMarker.setLatLng([lat, lng]);
                } else {
                    detailMarker = L.marker([lat, lng]).addTo(detailMap);
                }
                detailMap.invalidateSize();
            }
        });
    }
});

// สูตรคำนวณระยะทาง
window.calculateDistance = function(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
};
`;

let c = fs.readFileSync('js/item.js', 'utf8');
if (!c.includes('// 🗺️ ระบบแผนที่และการปักหมุด (Leaflet Map)')) {
    fs.writeFileSync('js/item.js', c + '\n' + mapScript, 'utf8');
    console.log('Appended map script to js/item.js');
}

