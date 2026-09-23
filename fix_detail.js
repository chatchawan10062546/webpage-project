const fs = require('fs');
let c = fs.readFileSync('js/item.js', 'utf8');

c = c.replace(/const status = btn.dataset.status \|\| 'available';/, "const status = btn.dataset.status || 'available';\n            const lat = btn.closest('.item-element').dataset.latitude;\n            const lng = btn.closest('.item-element').dataset.longitude;");
c = c.replace(/showItemDetailModal\(\{ itemId, ownerId, ownerName, ownerLevel, ownerRating, title, category, itemType, price, quantity, status, location, description, images, distance \}\);/, "showItemDetailModal({ itemId, ownerId, ownerName, ownerLevel, ownerRating, title, category, itemType, price, quantity, status, location, description, images, distance, lat, lng });");

// Update showItemDetailModal dataset on itemDetailMap
c = c.replace(/<div class="modal fade" id="itemDetailModal"/, "<div class=\"modal fade\" id=\"itemDetailModal\" data-lat=\"${item.lat || ''}\" data-lng=\"${item.lng || ''}\"");
c = c.replace(/id="detailMapSection" style="display: none;"/, "id=\"detailMapSection\" style=\"display: ${item.lat && item.lng ? 'block' : 'none'};\" data-lat=\"${item.lat || ''}\" data-lng=\"${item.lng || ''}\"");

fs.writeFileSync('js/item.js', c, 'utf8');
console.log('Fixed item.js detail modal logic');
