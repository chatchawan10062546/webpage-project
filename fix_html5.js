const fs = require('fs');
let content = fs.readFileSync('webpage.html', 'utf8');

const target = `                        </ul>

                    <div class="vr my-2 text-muted opacity-25"></div>
                    <div class="dropdown">
                        <button
                            class="btn btn-link text-decoration-none text-secondary px-3 py-2 d-flex align-items-center gap-2 shadow-none border-0"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 0.95rem;" data-bs-auto-close="outside">
                            <span id="distanceSliderLabel">ทุกระยะ</span>
                            <i class="bi bi-geo-alt-fill text-success"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow mt-2 p-3" style="width: 250px;">
                            <label class="form-label text-success fw-bold small mb-1">ระยะทางที่ต้องการ (กม.)</label>
                            <input type="range" class="form-range" id="distanceSlider" min="1" max="51" value="51">
                            <div class="text-center mt-3">
                                <button class="btn btn-sm btn-outline-success rounded-pill w-100 fw-bold" id="updateLocationBtn">
                                    📍 อัปเดตพิกัดของคุณ
                                </button>
                            </div>
                        </div>
                    </div>
                    </div>`;

const replacement = `                        </ul>
                    </div>

                    <div class="vr my-2 text-muted opacity-25"></div>
                    <div class="dropdown">
                        <button
                            class="btn btn-link text-decoration-none text-secondary px-3 py-2 d-flex align-items-center gap-2 shadow-none border-0"
                            type="button" data-bs-toggle="dropdown" aria-expanded="false" style="font-size: 0.95rem;" data-bs-auto-close="outside">
                            <span id="distanceSliderLabel">ทุกระยะ</span>
                            <i class="bi bi-geo-alt-fill text-success"></i>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end rounded-3 border-0 shadow mt-2 p-3" style="width: 250px;">
                            <label class="form-label text-success fw-bold small mb-1">ระยะทางที่ต้องการ (กม.)</label>
                            <input type="range" class="form-range" id="distanceSlider" min="1" max="51" value="51">
                            <div class="text-center mt-3">
                                <button class="btn btn-sm btn-outline-success rounded-pill w-100 fw-bold" id="updateLocationBtn">
                                    📍 อัปเดตพิกัดของคุณ
                                </button>
                            </div>
                        </div>
                    </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('webpage.html', content, 'utf8');
