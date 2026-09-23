const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const target = `            let coordinates = { latitude: null, longitude: null };
            const mapLat = document.getElementById('itemLat')?.value;
            const mapLng = document.getElementById('itemLng')?.value;
            if (mapLat && mapLng) {
                coordinates.latitude = parseFloat(mapLat);
                coordinates.longitude = parseFloat(mapLng);
            } else {
                try {
                    coordinates = await getCurrentCoordinates();
                } catch (error) {
                    alert('กรุณาปักหมุดบนแผนที่ หรืออนุญาตตำแหน่ง');
                    return;
                }
            }`;

const replacement = `            let coordinates = { latitude: null, longitude: null };
            const showMapToggle = document.getElementById('showMapToggle');
            const isMapEnabled = showMapToggle ? showMapToggle.checked : true;
            
            if (isMapEnabled) {
                const mapLat = document.getElementById('itemLat')?.value;
                const mapLng = document.getElementById('itemLng')?.value;
                if (mapLat && mapLng) {
                    coordinates.latitude = parseFloat(mapLat);
                    coordinates.longitude = parseFloat(mapLng);
                } else {
                    try {
                        coordinates = await getCurrentCoordinates();
                    } catch (error) {
                        alert('กรุณาปักหมุดบนแผนที่ หรืออนุญาตตำแหน่ง');
                        return;
                    }
                }
            }`;

c = c.replace(target, replacement);
fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Updated item.js coordinate capture logic');
