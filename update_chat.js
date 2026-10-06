const fs = require('fs');
let c = fs.readFileSync('js/chat.js', 'utf8');

const oldRender = '                <div class="d-inline-block bg-light border rounded px-3 py-2">${message.message}</div>';
const newRender = '                <div class="d-inline-block bg-light border rounded px-3 py-2">\n                    ${message.message.startsWith("[IMAGE]") ? "<img src=\\"" + message.message.replace("[IMAGE]", "") + "\\" class=\\"img-fluid rounded\\" style=\\"max-height: 200px; cursor: pointer;\\" onclick=\\"window.open(this.src, \'_blank\')\\">" : message.message}\n                </div>';
c = c.replace(oldRender, newRender);

const oldForm = '<form id="chatMessageForm" class="d-flex gap-2">\n                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ..." required>\n                                    <button class="btn btn-success" type="submit">ส่ง</button>\n                                </form>';
const newForm = '<form id="chatMessageForm" class="d-flex gap-2 align-items-center">\n                                    <input type="file" id="chatImageUpload" accept="image/jpeg, image/png" class="d-none">\n                                    <button type="button" class="btn btn-outline-secondary" onclick="document.getElementById(\'chatImageUpload\').click()"><i class="bi bi-image"></i></button>\n                                    <input id="chatMessageInput" class="form-control" placeholder="พิมพ์ข้อความ... (หรือแนบสลิป/รูปภาพ)">\n                                    <button class="btn btn-success" type="submit">ส่ง</button>\n                                </form>\n                                <div id="chatImagePreview" class="d-none mt-2">\n                                    <span class="badge bg-info text-dark">📷 เลือกรูปภาพแล้ว (กดส่งเพื่ออัปโหลด)</span>\n                                </div>';
c = c.replace(oldForm, newForm);

const oldSubmit = "document.getElementById('chatMessageForm').addEventListener('submit', event => {\n                event.preventDefault();\n                const input = document.getElementById('chatMessageInput');\n                requestJson(`/api/chat/rooms/${room.room_id}/messages`, {\n                    method: 'POST',\n                    headers: { 'Content-Type': 'application/json' },\n                    body: JSON.stringify({ user_id: userId, user_name: user.name, message: input.value })\n                }).then(() => { input.value = ''; loadMessages(); })\n                    .catch(error => alert('ส่งข้อความไม่สำเร็จ: ' + error.message));\n            });";
const newSubmit = `
            // Show preview indicator when file is selected
            document.getElementById('chatImageUpload').addEventListener('change', function() {
                const preview = document.getElementById('chatImagePreview');
                if (this.files.length > 0) preview.classList.remove('d-none');
                else preview.classList.add('d-none');
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
c = c.replace(oldSubmit, newSubmit);

fs.writeFileSync('js/chat.js', c, 'utf8');
console.log('Chat JS updated');
