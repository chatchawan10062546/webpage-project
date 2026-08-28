// ====================================================
// 📄 modals.js : จัดการ Modal ฟอร์มลงประกาศรายการใหม่
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const modalContainer = document.getElementById('modalContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
        <!-- Modal ลงประกาศรายการใหม่ -->
        <div class="modal fade" id="postItemModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-header-title fw-bold mb-0">📢 ลงประกาศรายการใหม่</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="postItemForm">
                            
                            <!-- ตัวเลือกประเภทประกาศ -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">ประเภทประกาศ <span class="text-danger">*</span></label>
                                <div class="btn-group w-100" role="group">
                                    <input type="radio" class="btn-check" name="itemType" id="typeFree" value="free" checked>
                                    <label class="btn btn-outline-success fw-bold py-2" for="typeFree">🎁 แจกฟรี</label>

                                    <input type="radio" class="btn-check" name="itemType" id="typeSell" value="sell">
                                    <label class="btn btn-outline-primary fw-bold py-2" for="typeSell">🏷️ ซื้อขาย</label>

                                    <input type="radio" class="btn-check" name="itemType" id="typeRent" value="rent">
                                    <label class="btn btn-outline-warning fw-bold text-dark py-2" for="typeRent">🔑 ให้เช่า</label>
                                </div>
                            </div>

                            <!-- ช่องใส่ราคา (เปิดเมื่อเลือกขาย/เช่า) -->
                            <div class="mb-3 d-none" id="priceInputContainer">
                                <label for="postPrice" class="form-label fw-bold" id="priceLabel">ราคา (บาท)</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="postPrice" placeholder="0" min="0">
                                    <span class="input-group-text" id="priceUnitText">บาท</span>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="postTitle" class="form-label fw-bold">ชื่อรายการสิ่งของ <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="postTitle" placeholder="เช่น สลัดผัก, หนังสือเรียน, หม้อทอด" required>
                            </div>

                            <div class="mb-3">
                                <label for="postCategory" class="form-label fw-bold">หมวดหมู่ <span class="text-danger">*</span></label>
                                <select class="form-select" id="postCategory" required>
                                    <option value="" selected disabled>-- เลือกหมวดหมู่ --</option>
                                    <option value="อาหาร">🥗 อาหาร</option>
                                    <option value="ของใช้">📦 ของใช้</option>
                                    <option value="อื่นๆ">✨ อื่นๆ</option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label for="postLocation" class="form-label fw-bold">สถานที่ / ชุมชน</label>
                                <input type="text" class="form-control" id="postLocation" placeholder="เช่น ชุมชน มมส., หน้าหอพัก A">
                            </div>

                            <div class="mb-3">
                                <label for="postDescription" class="form-label fw-bold">รายละเอียดสิ่งของ</label>
                                <textarea class="form-control" id="postDescription" rows="3" placeholder="ระบุสภาพของ วันหมดอายุ หรือเงื่อนไขเพิ่มเติม..."></textarea>
                            </div>

                            <!-- อัปโหลดได้หลายรูปภาพ -->
                            <div class="mb-3">
                                <label for="postImageFile" class="form-label fw-bold">รูปภาพสิ่งของ (เลือกได้หลายรูป)</label>
                                <input class="form-control" type="file" id="postImageFile" accept="image/*" multiple>
                                <div class="form-text">สามารถกด Ctrl หรือ Shift เพื่อเลือกหลายรูปพร้อมกันได้ครับ</div>
                            </div>

                            <button type="submit" class="btn btn-success w-100 py-3 rounded-pill fw-bold shadow-sm fs-5 mt-3">
                                🚀 ยืนยันลงประกาศ
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    // ซ่อน/แสดง ช่องระบุราคา
    document.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'itemType') {
            const priceContainer = document.getElementById('priceInputContainer');
            const priceLabel = document.getElementById('priceLabel');
            const priceUnitText = document.getElementById('priceUnitText');

            if (e.target.value === 'sell') {
                priceContainer.classList.remove('d-none');
                priceLabel.innerText = 'ราคาขาย (บาท)';
                priceUnitText.innerText = 'บาท';
            } else if (e.target.value === 'rent') {
                priceContainer.classList.remove('d-none');
                priceLabel.innerText = 'ค่าเช่า (บาท/วัน)';
                priceUnitText.innerText = 'บาท/วัน';
            } else {
                priceContainer.classList.add('d-none');
            }
        }
    });
});