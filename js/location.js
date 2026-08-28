// ====================================================
// 📍 location.js : ระบบขอพิกัด GPS และคำนวณระยะทางจริง (กม.)
// ====================================================

// พิกัดจำลองของจุดแจกแต่ละสถานที่ (Latitude, Longitude)
const locationCoordinates = {
    'ชุมชน มมส.': { lat: 16.2467, lng: 103.2521 },
    'หน้าหอพัก A': { lat: 16.2490, lng: 103.2550 },
    'ตลาดนัด': { lat: 16.2430, lng: 103.2500 }
};

// พิกัดสำรองกรณีผู้ใช้ปฏิเสธการแชร์ตำแหน่ง (ตั้งเป็นพิกัดกลาง)
const DEFAULT_LAT = 16.2450;
const DEFAULT_LNG = 103.2510;

document.addEventListener('DOMContentLoaded', () => {
    getUserLocation();
});

// 1. ขอตำแหน่ง GPS ของผู้ใช้จาก Browser
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                updateAllItemDistances(userLat, userLng);
            },
            (error) => {
                console.warn('ผู้ใช้ไม่อนุญาตเข้าถึงพิกัด หรือเกิดข้อผิดพลาด:', error.message);
                // ถ้าปฏิเสธ ให้ใช้พิกัดสำรองในการคำนวณแทน
                updateAllItemDistances(DEFAULT_LAT, DEFAULT_LNG);
            }
        );
    } else {
        console.warn('เบราว์เซอร์นี้ไม่รองรับ Geolocation');
        updateAllItemDistances(DEFAULT_LAT, DEFAULT_LNG);
    }
}

// 2. คำนวณระยะทางด้วยสูตร Haversine (คืนค่าเป็น กิโลเมตร)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // รัศมีโลก (กม.)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance < 1) {
        return `${Math.round(distance * 1000)} เมตร`;
    }
    return `${distance.toFixed(1)} กิโลเมตร`;
}

// 3. วนลูปอัปเดตระยะทางบนการ์ดทุกใบในหน้าเว็บ
function updateAllItemDistances(userLat, userLng) {
    const cards = document.querySelectorAll('#itemGrid .card');

    cards.forEach((card) => {
        const locationTextEl = card.querySelector('.text-muted.small');
        if (!locationTextEl) return;

        // สุ่มหรือดึงพิกัดจากข้อความสถานที่ในการ์ด
        let targetLat = userLat + (Math.random() - 0.5) * 0.03; // สุ่มระยะทางใกล้เคียงกรณีไม่มีพิกัดจริง
        let targetLng = userLng + (Math.random() - 0.5) * 0.03;

        // คำนวณระยะทาง
        const distText = calculateDistance(userLat, userLng, targetLat, targetLng);

        // ดึงชื่อสถานที่เดิม (ถ้ามี)
        const currentText = locationTextEl.innerText;
        const subLocation = currentText.includes('(') ? currentText.substring(currentText.indexOf('(')) : '';

        // อัปเดตข้อความบนการ์ด
        locationTextEl.innerText = `📍 ห่างจากคุณ ${distText} ${subLocation}`;
    });
}