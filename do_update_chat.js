const fs = require('fs');
let c = fs.readFileSync('js/chat.js', 'utf8');

// The original strings (using exact regex to avoid whitespace issues)
c = c.replace(/<form id="chatMessageForm" class="d-flex gap-2">[\s\S]*?<\/form>/, `<form id="chatMessageForm" class="d-flex gap-2 align-items-center">
                                    <input type="file" id="chatImageUpload" accept="image/jpeg, image/png" class="d-none">
                                    <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById('chatImageUpload').click()"><i class="bi bi-image"></i></button>
                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ... (หรือแนบสลิป/รูปภาพ)">
                                    <button class="btn btn-success" type="submit">ส่ง</button>
                                </form>
                                <div id="chatImagePreview" class="d-none mt-2">
                                    <span class="badge bg-info text-dark">📷 เลือกรูปภาพแล้ว (กดส่งเพื่ออัปโหลด)</span>
                                </div>`);

// Submit event
const oldSubmitRegex = /document\.getElementById\('chatMessageForm'\)\.addEventListener\('submit', event => \{[\s\S]*?\}\);/;
const newSubmit = `
            // Show preview indicator when file is selected
            document.body.addEventListener('change', function(e) {
                if(e.target && e.target.id === 'chatImageUpload') {
                    const preview = document.getElementById('chatImagePreview');
                    if (e.target.files.length > 0) preview.classList.remove('d-none');
                    else preview.classList.add('d-none');
                }
            });

            document.getElementById('chatMessageForm').addEventListener('submit', async event => {
                event.preventDefault();
                const input = document.getElementById('chatMessageInput');
                const fileInput = document.getElementById('chatImageUpload');
                
                if (!input.value.trim() && (!fileInput || fileInput.files.length === 0)) {
                    return alert('กรุณาพิมพ์ข้อความ หรือแนบรูปภาพ');
                }
                
                const formData = new FormData();
                formData.append('user_id', userId);
                formData.append('user_name', user.name);
                formData.append('message', input.value.trim() || ' ');
                if (fileInput && fileInput.files.length > 0) {
                    formData.append('image', fileInput.files[0]);
                }

                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(\`/api/chat/rooms/\${room.room_id}/messages\`, {
                        method: 'POST',
                        headers: { 'Authorization': \`Bearer \${token}\` },
                        body: formData
                    });
                    const data = await response.json();
                    if (!data.success) throw new Error(data.message);
                    
                    input.value = '';
                    if (fileInput) {
                        fileInput.value = '';
                        document.getElementById('chatImagePreview').classList.add('d-none');
                    }
                    loadMessages();
                } catch (error) {
                    alert('ส่งข้อความไม่สำเร็จ: ' + error.message);
                }
            });
`;
c = c.replace(oldSubmitRegex, newSubmit);

// Render Messages
const oldRender = /<div class="d-inline-block bg-light border rounded px-3 py-2">\$\{message\.message\}<\/div>/;
const newRender = `<div class="d-inline-block bg-light border rounded px-3 py-2">
                    \${message.message.startsWith('[IMAGE]') 
                        ? '<img src="' + message.message.replace('[IMAGE]', '') + '" class="img-fluid rounded" style="max-height: 200px; cursor: pointer;" onclick="window.open(this.src, \\'_blank\\')">' 
                        : message.message}
                </div>`;
c = c.replace(oldRender, newRender);

fs.writeFileSync('js/chat.js', c, 'utf8');
console.log('Update successful');
