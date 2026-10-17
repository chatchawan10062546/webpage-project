// ====================================================
// 💳 utils/slipVerifier.js : โมดูลตรวจสอบสลิปโอนเงินอัตโนมัติ (SlipOK API)
// ====================================================
const fs = require('fs');

/**
 * ตรวจสอบสลิปโอนเงินผ่าน SlipOK API
 * @param {Object} params
 * @param {string} params.filePath - Path เต็มของไฟล์สลิปบนเซิร์ฟเวอร์
 * @param {number} params.expectedAmount - ยอดเงินที่ต้องชำระ
 * @param {Object} params.db - Instance ของ MySQL database เพื่อเช็ก trans_ref ซ้ำ
 * @returns {Promise<{success: boolean, message: string, data?: Object}>}
 */
async function verifySlip({ filePath, expectedAmount, db }) {
    const apiKey = process.env.SLIPOK_API_KEY;
    const branchId = process.env.SLIPOK_BRANCH_ID;

    if (!apiKey || !branchId) {
        // หากไม่ได้ตั้งค่า API Key ให้ถือว่าข้ามการตรวจอัตโนมัติ (เป็นโหมด Manual)
        return {
            success: true,
            isManual: true,
            message: 'ไม่ได้เปิดใช้งาน API ตรวจสลิปอัตโนมัติ (บันทึกเป็นสลิปตรวจสอบด้วยตนเอง)'
        };
    }

    if (!fs.existsSync(filePath)) {
        return { success: false, message: 'ไม่พบไฟล์สลิปในเซิร์ฟเวอร์' };
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('files', blob, 'slip.jpg');
        if (expectedAmount && Number(expectedAmount) > 0) {
            formData.append('amount', Number(expectedAmount).toFixed(2));
        }
        formData.append('log', 'true');

        const url = `https://api.slipok.com/api/line/apikey/${branchId}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-authorization': apiKey
            },
            body: formData
        });

        const result = await response.json();

        // 1. ตรวจสอบกรณีที่ SlipOK คืนค่า Error
        if (!response.ok || result.success === false) {
            const code = result.code;
            let errorMsg = result.message || 'สลิปไม่ถูกต้อง';

            switch (code) {
                case 1007:
                    errorMsg = 'รูปภาพไม่มี QR Code กรุณาอัปโหลดสลิปธนาคารที่มี QR Code ชัดเจน';
                    break;
                case 1008:
                    errorMsg = 'QR Code ไม่ถูกต้อง หรือไม่ใช่สลิปโอนเงินของธนาคาร';
                    break;
                case 1009:
                    errorMsg = 'ระบบธนาคารปลายทางขัดข้องชั่วคราว ไม่สามารถตรวจสอบได้ในขณะนี้';
                    break;
                case 1010:
                    errorMsg = 'สลิปนี้เกินระยะเวลาที่ธนาคารอนุญาตให้ตรวจสอบแล้ว (สลิปเก่าเกินไป)';
                    break;
                case 1011:
                    errorMsg = 'สลิปนี้ไม่ได้โอนเข้าบัญชีคนกลางของระบบ (ข้อมูลผู้รับเงินไม่ตรง)';
                    break;
                case 1012:
                    errorMsg = 'สลิปนี้เคยถูกใช้งานในระบบไปแล้ว ไม่สามารถใช้ซ้ำได้';
                    break;
                case 1013:
                    errorMsg = `ยอดเงินในสลิปไม่ตรงกับยอดที่ต้องชำระ (ยอดที่ต้องชำระ: ฿${Number(expectedAmount).toLocaleString()})`;
                    break;
            }

            return {
                success: false,
                code: code,
                message: errorMsg,
                raw: result
            };
        }

        // 2. กรณี SlipOK แจ้งว่าสลิปถูกต้อง
        const slipData = result.data || {};
        const transRef = slipData.transRef || '';
        const paidAmount = Number(slipData.amount || 0);

        // ตรวจสอบในฐานข้อมูลของเราอีกชั้น ป้องกันการนำสลิปเดิมมาใช้กับธุรกรรมอื่น
        if (transRef && db) {
            const isDuplicate = await new Promise((resolve) => {
                db.query(
                    'SELECT trans_id FROM transactions WHERE trans_ref = ? LIMIT 1',
                    [transRef],
                    (err, rows) => {
                        if (err || rows.length === 0) resolve(false);
                        else resolve(true);
                    }
                );
            });

            if (isDuplicate) {
                return {
                    success: false,
                    code: 1012,
                    message: 'สลิปนี้เคยถูกใช้งานในระบบไปแล้ว ไม่สามารถใช้ซ้ำได้'
                };
            }
        }

        // ตรวจสอบยอดเงิน (เผื่อ SlipOK ไม่ได้ตัดกรณีส่วนต่าง)
        if (expectedAmount && Number(expectedAmount) > 0) {
            const diff = Math.abs(paidAmount - Number(expectedAmount));
            if (diff > 1.0) { // ยอมรับส่วนต่างไม่เกิน 1 บาท
                return {
                    success: false,
                    code: 1013,
                    message: `ยอดเงินในสลิป (฿${paidAmount.toLocaleString()}) ไม่ตรงกับยอดที่ต้องชำระ (฿${Number(expectedAmount).toLocaleString()})`
                };
            }
        }

        return {
            success: true,
            transRef,
            paidAmount,
            sender: slipData.sender,
            receiver: slipData.receiver,
            transDate: slipData.transDate,
            transTime: slipData.transTime,
            raw: result
        };

    } catch (err) {
        console.error('SlipOK Verification Exception:', err);
        return {
            success: false,
            message: 'เกิดข้อผิดพลาดในการเชื่อมต่อระบบตรวจสอบสลิป: ' + err.message
        };
    }
}

module.exports = { verifySlip };

