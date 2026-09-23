const fs = require('fs');
let c = fs.readFileSync('js/admin.js', 'utf8');

const targetFunction = `    function renderPendingItems(items) {
        renderTable(document.getElementById('adminPendingItemsList'), ['สินค้า', 'รายละเอียด', 'ผู้โพสต์', 'จัดการ'], items.map(item => \`
            <tr>
                <td>
                    <img src="\${item.image_url}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                    <strong>\${escapeHtml(item.title)}</strong>
                </td>
                <td><small class="text-muted">\${escapeHtml(item.category)} • \${item.item_type === 'free' ? 'ฟรี' : \`฿\${Number(item.price).toLocaleString()}\`}</small></td>
                <td>\${escapeHtml(item.owner_name)}<div class="small text-muted">\${escapeHtml(item.owner_email)}</div></td>
                <td>
                    <button class="btn btn-success btn-sm approve-item-btn" data-item-id="\${item.item_id}">✅ อนุมัติ</button>
                    <button class="btn btn-danger btn-sm reject-item-btn" data-item-id="\${item.item_id}">❌ ไม่อนุมัติ</button>
                </td>
            </tr>
        \`));
    }`;

const replacementFunction = `    function renderPendingItems(items) {
        const newItems = items.filter(item => !item.is_edited);
        const editedItems = items.filter(item => item.is_edited);
        
        const renderRow = (item) => \`
            <tr>
                <td>
                    <img src="\${item.image_url}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
                    <strong>\${escapeHtml(item.title)}</strong>
                    \${item.is_edited ? '<span class="badge bg-warning text-dark ms-2">โพสต์ที่มีการแก้ไข</span>' : '<span class="badge bg-primary ms-2">โพสต์ใหม่</span>'}
                </td>
                <td><small class="text-muted">\${escapeHtml(item.category)} • \${item.item_type === 'free' ? 'ฟรี' : \`฿\${Number(item.price).toLocaleString()}\`}</small></td>
                <td>\${escapeHtml(item.owner_name)}<div class="small text-muted">\${escapeHtml(item.owner_email)}</div></td>
                <td>
                    <button class="btn btn-success btn-sm approve-item-btn" data-item-id="\${item.item_id}">✅ อนุมัติ</button>
                    <button class="btn btn-danger btn-sm reject-item-btn" data-item-id="\${item.item_id}">❌ ไม่อนุมัติ</button>
                </td>
            </tr>
        \`;

        const container = document.getElementById('adminPendingItemsList');
        container.innerHTML = '<h5>📌 รอตรวจสอบ (โพสต์ใหม่)</h5><div id="newItemsTable"></div><h5 class="mt-4">📝 รอตรวจสอบ (โพสต์ที่แก้ไขแล้ว)</h5><div id="editedItemsTable"></div>';
        
        renderTable(document.getElementById('newItemsTable'), ['สินค้า', 'รายละเอียด', 'ผู้โพสต์', 'จัดการ'], newItems.map(renderRow));
        renderTable(document.getElementById('editedItemsTable'), ['สินค้า', 'รายละเอียด', 'ผู้โพสต์', 'จัดการ'], editedItems.map(renderRow));
    }`;

c = c.replace(targetFunction, replacementFunction);
fs.writeFileSync('js/admin.js', c, 'utf8');
console.log('Updated admin.js renderPendingItems');
