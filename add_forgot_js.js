const fs = require('fs');
let code = fs.readFileSync('js/auth.js', 'utf8');

const forgotJs = `
    // ----------------------------------------------------
    // 🔥 ระบบลืมรหัสผ่าน
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgotEmail').value;
            try {
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                
                if (data.success) {
                    alert('ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว (จำลอง)');
                    forgotPasswordForm.reset();
                    bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
                } else {
                    alert(data.message || 'ไม่พบอีเมลนี้ในระบบ');
                }
            } catch (error) {
                console.error(error);
                alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
            }
        });
    }
`;

code += forgotJs;
fs.writeFileSync('js/auth.js', code);
console.log('Modified auth.js for Forgot Password');
