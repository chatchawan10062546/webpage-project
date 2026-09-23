const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

const sIdx = c.indexOf('let coordinates;\n            try {\n                coordinates = await getCurrentCoordinates();\n            } catch (error) {\n                alert(error.message);\n                return;\n            }');
if (sIdx !== -1) {
    console.log('Found with LF');
}
const sIdx2 = c.indexOf('let coordinates;\r\n            try {\r\n                coordinates = await getCurrentCoordinates();\r\n            } catch (error) {\r\n                alert(error.message);\r\n                return;\r\n            }');
if (sIdx2 !== -1) {
    console.log('Found with CRLF');
}

c = c.replace(/let coordinates;\r?\n\s*try \{\r?\n\s*coordinates = await getCurrentCoordinates\(\);\r?\n\s*\} catch \(error\) \{\r?\n\s*alert\(error.message\);\r?\n\s*return;\r?\n\s*\}/g, "let coordinates = { latitude: null, longitude: null };\n            const mapLat = document.getElementById('itemLat')?.value;\n            const mapLng = document.getElementById('itemLng')?.value;\n            if (mapLat && mapLng) {\n                coordinates.latitude = parseFloat(mapLat);\n                coordinates.longitude = parseFloat(mapLng);\n            } else {\n                try {\n                    coordinates = await getCurrentCoordinates();\n                } catch (error) {\n                    alert('กรุณาปักหมุดบนแผนที่ หรืออนุญาตตำแหน่ง');\n                    return;\n                }\n            }");
fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Updated coordinates logic');
