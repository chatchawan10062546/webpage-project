const fs = require('fs');
let code = fs.readFileSync('webpage.html', 'utf8');

// Add Forgot Password link
const loginBtnRegex = /<button type="submit" class="btn btn-success w-100 py-3 rounded-pill fw-bold">เข้าสู่ระบบ<\/button>/;
const loginBtnReplacement = `<div class="d-flex justify-content-end mb-3">
                            <button type="button" class="btn btn-link text-decoration-none text-muted p-0 small" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#forgotPasswordModal">ลืมรหัสผ่านใช่ไหม?</button>
                        </div>
                        <button type="submit" class="btn btn-success w-100 py-3 rounded-pill fw-bold">เข้าสู่ระบบ</button>`;
code = code.replace(loginBtnRegex, loginBtnReplacement);

// Add Forgot Password Modal
const registerModalRegex = /<!-- Modal สมัครสมาชิก -->/;
const forgotPasswordModal = `
    <!-- Modal ลืมรหัสผ่าน -->
    <div class="modal fade" id="forgotPasswordModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header bg-warning text-dark">
                    <h5 class="modal-title fw-bold">🔑 ลืมรหัสผ่าน</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4">
                    <p class="text-muted text-center mb-4">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่านชั่วคราว</p>
                    <form id="forgotPasswordForm">
                        <div class="mb-3">
                            <label for="forgotEmail" class="form-label fw-bold">อีเมล</label>
                            <input type="email" class="form-control" id="forgotEmail" placeholder="name@example.com" required>
                        </div>
                        <button type="submit" class="btn btn-warning w-100 py-3 rounded-pill fw-bold text-dark">ส่งลิงก์รีเซ็ตรหัสผ่าน</button>
                    </form>
                    <div class="text-center mt-3">
                        <button type="button" class="btn btn-link text-secondary fw-bold p-0" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#loginModal">กลับไปหน้าเข้าสู่ระบบ</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal สมัครสมาชิก -->`;
code = code.replace(registerModalRegex, forgotPasswordModal);

fs.writeFileSync('webpage.html', code);
console.log('Modified webpage.html for Forgot Password');
