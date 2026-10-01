const fs = require('fs');
let c = fs.readFileSync('js/profile.js', 'utf8').split('\n');

const logicStart = c.findIndex(l => l.includes("const pForm = document.getElementById('profileForm');"));
let logicEnd = c.findIndex(l => l.includes("alert('เปิดโปรไฟล์ไม่สำเร็จ"));
if (logicEnd > -1) {
    logicEnd = logicEnd - 2;
}

if (logicStart > -1 && logicEnd > -1) {
    const newLogic = [
        "            const pForm = document.getElementById('profileForm');",
        "            const editBtn = document.getElementById('editProfileBtn');",
        "            const saveBtn = document.getElementById('saveProfileBtn');",
        "",
        "            if (editBtn) {",
        "                editBtn.addEventListener('click', () => {",
        "                    document.getElementById('profileName').disabled = false;",
        "                    document.getElementById('profilePhone').disabled = false;",
        "                    document.getElementById('profilePromptpayNumber').disabled = false;",
        "                    document.getElementById('profilePromptpayName').disabled = false;",
        "                    editBtn.classList.add('d-none');",
        "                    saveBtn.classList.remove('d-none');",
        "                });",
        "            }",
        "",
        "            if (pForm) pForm.addEventListener('submit', async event => {",
        "                event.preventDefault();",
        "                try {",
        "                    const updatedName = document.getElementById('profileName').value;",
        "                    const updatedPhone = document.getElementById('profilePhone').value;",
        "                    const updatedPromptpayNumber = document.getElementById('profilePromptpayNumber').value;",
        "                    const updatedPromptpayName = document.getElementById('profilePromptpayName').value;",
        "",
        "                    const result = await requestJson('/api/profile', {",
        "                        method: 'PUT',",
        "                        headers: { 'Content-Type': 'application/json' },",
        "                        body: JSON.stringify({ ",
        "                            user_id: userId, ",
        "                            name: updatedName, ",
        "                            phone: updatedPhone,",
        "                            promptpay_number: updatedPromptpayNumber,",
        "                            promptpay_name: updatedPromptpayName",
        "                        })",
        "                    });",
        "",
        "                    const storedUser = getUser();",
        "                    localStorage.setItem('user', JSON.stringify({ ",
        "                        ...storedUser, ",
        "                        name: result.profile.name, ",
        "                        phone: result.profile.phone, ",
        "                        promptpay_number: result.profile.promptpay_number, ",
        "                        promptpay_name: result.profile.promptpay_name ",
        "                    }));",
        "",
        "                    alert('บันทึกโปรไฟล์และพร้อมเพย์สำเร็จ');",
        "                    document.getElementById('profileName').disabled = true;",
        "                    document.getElementById('profilePhone').disabled = true;",
        "                    document.getElementById('profilePromptpayNumber').disabled = true;",
        "                    document.getElementById('profilePromptpayName').disabled = true;",
        "                    saveBtn.classList.add('d-none');",
        "                    if(editBtn) editBtn.classList.remove('d-none');",
        "                    ",
        "                    const headerName = document.querySelector('.profile-header h4');",
        "                    if(headerName) headerName.innerText = result.profile.name;",
        "                } catch (error) {",
        "                    alert('บันทึกโปรไฟล์ไม่สำเร็จ: ' + error.message);",
        "                }",
        "            });"
    ].join('\n');
    c.splice(logicStart, logicEnd - logicStart, newLogic);
}

fs.writeFileSync('js/profile.js', c.join('\n'), 'utf8');
console.log('Fixed profile.js without reload');
