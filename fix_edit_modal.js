const fs = require('fs');
let c = fs.readFileSync('js/itemManagement.js', 'utf8');

const targetHtml = `<div class="mb-3">
                                    <label for="editPrice" class="form-label fw-bold">ราคา</label>
                                    <input id="editPrice" class="form-control" type="number" min="0">
                                </div>`;
const replacementHtml = `<div class="mb-3" id="editPriceContainer">
                                    <label for="editPrice" class="form-label fw-bold">ราคา</label>
                                    <input id="editPrice" class="form-control" type="number" min="0">
                                </div>`;

if(c.includes(targetHtml)) {
    c = c.replace(targetHtml, replacementHtml);
}

const targetJs = `document.getElementById('editType').value = item.item_type || 'free';`;
const replacementJs = `document.getElementById('editType').value = item.item_type || 'free';
            const priceContainer = document.getElementById('editPriceContainer');
            if(priceContainer) {
                priceContainer.style.display = (item.item_type === 'free') ? 'none' : 'block';
            }`;

if(c.includes(targetJs)) {
    c = c.replace(targetJs, replacementJs);
}

// Add event listener for editType change
const targetListener = `const modalElement = document.getElementById('editItemModal');`;
const replacementListener = `const modalElement = document.getElementById('editItemModal');
        
        const editTypeEl = document.getElementById('editType');
        if (editTypeEl) {
            editTypeEl.addEventListener('change', (e) => {
                const priceContainer = document.getElementById('editPriceContainer');
                if (priceContainer) {
                    priceContainer.style.display = (e.target.value === 'free') ? 'none' : 'block';
                }
            });
        }`;

if(c.includes(targetListener)) {
    c = c.replace(targetListener, replacementListener);
}

fs.writeFileSync('js/itemManagement.js', c, 'utf8');
console.log('Fixed edit price toggle');
