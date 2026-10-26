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

                            <div class="mb-3">
                                <label for="postTitle" class="form-label fw-bold">ชื่อรายการสิ่งของ <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="postTitle" placeholder="เช่น สลัดผัก, หนังสือเรียน, หม้อทอด" required>
                            </div>

                            <div class="mb-3">
                                <label for="postCategory" class="form-label fw-bold">หมวดหมู่ <span class="text-danger">*</span></label>
                                <select class="form-select" id="postCategory" required>
                                    <option value="" selected disabled>-- เลือกหมวดหมู่ --</option>
                                    <option value="อาหาร">🥗 อาหาร</option>
                                    <option value="เสื้อผ้า">👕 เสื้อผ้า</option>
                                    <option value="ของใช้">📦 ของใช้</option>
                                    <option value="อื่นๆ">✨ อื่นๆ</option>
                                </select>
                            </div>

                            <!-- ช่องใส่ราคา (เปิดเมื่อเลือกขาย/เช่า) -->
                            <div class="mb-3 d-none" id="priceInputContainer">
                                <label for="postPrice" class="form-label fw-bold" id="priceLabel">ราคา (บาท)</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="postPrice" placeholder="0" min="0">
                                    <span class="input-group-text" id="priceUnitText">บาท</span>
                                </div>
                            </div>

                            <!-- ช่องใส่เงินมัดจำ/ประกัน (เปิดเมื่อเลือกให้เช่า) -->
                            <div class="mb-3 d-none" id="depositInputContainer">
                                <label for="postDeposit" class="form-label fw-bold text-dark">🛡️ เงินมัดจำ / ประกันสินค้าเสียหาย (บาท)</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="postDeposit" placeholder="0" min="0">
                                    <span class="input-group-text">บาท</span>
                                </div>
                                <div class="form-text text-muted">เงินส่วนนี้จะคืนให้ผู้เช่าเมื่อส่งของคืนสภาพสมบูรณ์ (หากไม่มีให้ใส่ 0)</div>
                                <div class="alert alert-warning py-2 px-3 mt-2 mb-0 rounded-3 small border border-warning-subtle d-flex align-items-center gap-2">
                                    <i class="bi bi-lightbulb-fill text-warning flex-shrink-0 fs-6"></i>
                                    <div><strong>💡 คำแนะนำการตั้งมัดจำ:</strong> ควรตั้งค่ามัดจำประมาณ <strong>30% - 50% ของมูลค่าสินค้า</strong> เพื่อคุ้มครองกรณีเกิดการชำรุด เสียหาย หรืออุปกรณ์สูญหาย</div>
                                </div>
                            </div>

                            <!-- ช่องระบุจำนวนชิ้น -->
                            <div class="mb-3">
                                <label for="postQuantity" class="form-label fw-bold">จำนวนชิ้น <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="postQuantity" value="1" min="1" required>
                                <div class="form-text text-muted">ลดจำนวนลงอัตโนมัติเมื่อกดอนุมัติคำขอรับของ</div>
                            </div>

                            <div class="mb-3">
                                <label for="postDescription" class="form-label fw-bold">รายละเอียดสิ่งของ</label>
                                <textarea class="form-control" id="postDescription" rows="3" placeholder="ระบุสภาพของ วันหมดอายุ หรือเงื่อนไขเพิ่มเติม..."></textarea>
                            </div>

                            <div class="mb-3">
                                <label for="postLocation" class="form-label fw-bold">สถานที่ / ชุมชน</label>
                                <input type="text" class="form-control" id="postLocation" placeholder="เช่น ชุมชน มมส., หน้าหอพัก A">
                            </div>

                            <!-- อัปโหลดได้หลายรูปภาพ -->
                            

                            
                            <!-- Map section for Lat/Lng -->
                            <div class="mb-3" id="mapSection">
                                <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                    <label class="form-label fw-bold mb-0">จุดแจกของ / นัดรับ (คลิกหรือลากหมุดบนแผนที่)</label>
                                    <button type="button" class="btn btn-sm btn-outline-success rounded-pill fw-bold shadow-sm" id="btnUseCurrentLocation">
                                        <i class="bi bi-crosshair me-1"></i>🎯 ใช้ตำแหน่งปัจจุบันของฉัน
                                    </button>
                                </div>
                                <div id="addItemMap" style="height: 270px; width: 100%; border-radius: 12px; border: 1px solid #ced4da; overflow: hidden;"></div>
                                <input type="hidden" id="itemLat" name="lat">
                                <input type="hidden" id="itemLng" name="lng">
                                <div class="d-flex justify-content-between align-items-center mt-1 flex-wrap">
                                    <small class="text-muted"><i class="bi bi-geo-alt-fill text-danger"></i> พิกัด: <span id="latLngDisplay" class="text-danger fw-bold">ยังไม่ได้เลือก</span></small>
                                    <small class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-arrows-move"></i> คลิกหรือลากหมุดเพื่อปรับตำแหน่ง</small>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <label class="form-label fw-bold mb-0">📸 รูปภาพสิ่งของ (สูงสุด 5 รูป)</label>
                                    <span class="badge bg-secondary rounded-pill" id="postImageCountBadge">0/5 รูป</span>
                                </div>
                                <div class="border rounded-4 p-3 bg-light text-center" id="postImageArea">
                                    <div id="postImagePreviewContainer" class="d-flex flex-wrap gap-2 mb-2 justify-content-start"></div>
                                    <div id="postImagePromptBox" class="py-2">
                                        <input class="d-none" type="file" id="postImageFile" accept="image/jpeg, image/png, image/webp" multiple>
                                        <button type="button" class="btn btn-outline-success rounded-pill px-4 py-2 fw-bold" id="triggerImageUploadBtn">
                                            <i class="bi bi-images me-2"></i>เลือกรูปภาพ (เลือกได้ทีละรูปหรือพร้อมกัน)
                                        </button>
                                        <div class="form-text text-muted mt-2" style="font-size: 0.8rem;">
                                            รองรับ JPG, PNG, WEBP สูงสุดไม่เกิน 5 รูป (รูปแรกเป็นรูปหน้าปก)
                                        </div>
                                        <div class="alert alert-info py-2 px-3 mt-2 mb-0 rounded-3 small text-start border border-info-subtle d-flex align-items-center gap-2 d-none" id="rentPhotoAdviceBox">
                                            <i class="bi bi-camera-fill text-primary flex-shrink-0 fs-6"></i>
                                            <div><strong>📸 ข้อแนะนำ:</strong> ควรถ่ายและแนบรูปภาพสภาพสินค้าจริงในปัจจุบัน เพื่อเก็บไว้ใช้เป็นหลักฐานเช็กสภาพก่อน-หลัง (Before/After) ในการตรวจสอบความเสียหายเมื่อได้รับของคืน</div>
                                        </div>
                                    </div>
                                </div>
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

    // ซ่อน/แสดง ช่องระบุราคา เงินมัดจำ และคำแนะนำรูปภาพสำหรับรายการปล่อยเช่า
    document.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'itemType') {
            const priceContainer = document.getElementById('priceInputContainer');
            const depositContainer = document.getElementById('depositInputContainer');
            const priceLabel = document.getElementById('priceLabel');
            const priceUnitText = document.getElementById('priceUnitText');
            const rentPhotoAdviceBox = document.getElementById('rentPhotoAdviceBox');

            if (e.target.value === 'sell') {
                priceContainer?.classList.remove('d-none');
                depositContainer?.classList.add('d-none');
                rentPhotoAdviceBox?.classList.add('d-none');
                if (priceLabel) priceLabel.innerText = 'ราคาขาย (บาท)';
                if (priceUnitText) priceUnitText.innerText = 'บาท';
            } else if (e.target.value === 'rent') {
                priceContainer?.classList.remove('d-none');
                depositContainer?.classList.remove('d-none');
                rentPhotoAdviceBox?.classList.remove('d-none');
                if (priceLabel) priceLabel.innerText = 'ค่าเช่า (บาท/วัน)';
                if (priceUnitText) priceUnitText.innerText = 'บาท/วัน';
            } else {
                priceContainer?.classList.add('d-none');
                depositContainer?.classList.add('d-none');
                rentPhotoAdviceBox?.classList.add('d-none');
            }
        }
    });

    // รีเซ็ตสถานะเมื่อปิด Modal
    document.addEventListener('hidden.bs.modal', (e) => {
        if (e.target && e.target.id === 'postItemModal') {
            document.getElementById('rentPhotoAdviceBox')?.classList.add('d-none');
            document.getElementById('depositInputContainer')?.classList.add('d-none');
            document.getElementById('priceInputContainer')?.classList.add('d-none');
        }
    });
});