// ====================================================
// 📍 location.js : คำนวณระยะทางและจัดการพิกัด GPS ของผู้ใช้
// ====================================================

window.currentUserCoordinates = null;
const LOCATION_CACHE_KEY = 'pankanUserCoordinates';
const REMEMBERED_LOCATION_KEY = 'pankan_remembered_location';

// 1. อ่านพิกัดที่เคยบันทึกไว้ในเบราว์เซอร์
function getRememberedCoordinates() {
    try {
        const saved = JSON.parse(localStorage.getItem(REMEMBERED_LOCATION_KEY) || localStorage.getItem(LOCATION_CACHE_KEY) || 'null');
        if (saved && Number.isFinite(Number(saved.latitude)) && Number.isFinite(Number(saved.longitude))) {
            return {
                latitude: Number(saved.latitude),
                longitude: Number(saved.longitude),
                savedAt: saved.savedAt || saved.date || null
            };
        }
    } catch (e) {
        console.warn('Error reading remembered location:', e);
    }
    return null;
}

// 2. บันทึกพิกัดลงในความจำเครื่องแบบถาวร
function saveRememberedCoordinates(latitude, longitude) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    const data = {
        latitude: lat,
        longitude: lng,
        date: new Date().toISOString().slice(0, 10),
        savedAt: Date.now()
    };
    window.currentUserCoordinates = data;
    try {
        localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(REMEMBERED_LOCATION_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Error saving location:', e);
    }
    return data;
}

// 3. เริ่มต้นเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
    // 3.1 ดึงพิกัดที่จำไว้มาแสดงผลระยะทางทันที ไม่ต้องรอดึง GPS
    const remembered = getRememberedCoordinates();
    if (remembered) {
        window.currentUserCoordinates = remembered;
        updateAllItemDistances(remembered.latitude, remembered.longitude);
    }

    // 3.2 ตรวจสอบว่าเบราว์เซอร์เคยอนุญาตพิกัดไว้แล้วหรือไม่
    // ถ้าเคยอนุญาตแล้ว ให้แอบอัปเดตพิกัดเงียบๆ ในพื้นหลัง (ไม่เด้ง Popup กวนผู้ใช้)
    if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).then(result => {
            if (result.state === 'granted') {
                requestUserLocation({ silent: true })
                    .then(coords => updateAllItemDistances(coords.latitude, coords.longitude))
                    .catch(() => {});
            }
        }).catch(() => {});
    }
});

// 4. ฟังก์ชันขอพิกัด GPS จริงจากผู้ใช้ (รองรับทั้ง Wi-Fi / มือถือ และบันทึกจำไว้ทันที)
function requestUserLocation(options = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง'));
            return;
        }

        // ลองแบบรวดเร็ว (Cellular / Wi-Fi) ก่อน เพื่อไม่ให้เครื่องค้างและได้พิกัดไวแม้ในอาคาร
        navigator.geolocation.getCurrentPosition(
            position => {
                const coords = saveRememberedCoordinates(position.coords.latitude, position.coords.longitude);
                resolve(coords);
            },
            error => {
                // ถ้า timeout หรือดึงแบบเร็วไม่ได้ผล ให้ลองแบบ High Accuracy อีกครั้ง
                if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
                    navigator.geolocation.getCurrentPosition(
                        pos2 => {
                            const coords2 = saveRememberedCoordinates(pos2.coords.latitude, pos2.coords.longitude);
                            resolve(coords2);
                        },
                        err2 => reject(err2),
                        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
                    );
                } else {
                    reject(error);
                }
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
        );
    });
}

// ฟังก์ชันเดิมเพื่อให้โค้ดส่วนอื่นทำงานได้เหมือนเดิม
function getUserCoordinates() {
    const remembered = getRememberedCoordinates();
    if (remembered) {
        window.currentUserCoordinates = remembered;
        return Promise.resolve(remembered);
    }
    return requestUserLocation();
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371;
    const latitudeDelta = (lat2 - lat1) * Math.PI / 180;
    const longitudeDelta = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
        * Math.sin(longitudeDelta / 2) ** 2;
    const distance = earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return distance < 1
        ? `${Math.round(distance * 1000)} เมตร`
        : `${distance.toFixed(1)} กิโลเมตร`;
}

function updateAllItemDistances(userLat, userLng) {
    document.querySelectorAll('#itemGrid .item-element').forEach(card => {
        const itemLat = card.dataset.latitude ? Number(card.dataset.latitude) : NaN;
        const itemLng = card.dataset.longitude ? Number(card.dataset.longitude) : NaN;
        const distanceElement = card.querySelector('.item-distance');
        const detailButton = card.querySelector('.request-btn');

        if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng) || !distanceElement) return;

        const distanceStr = calculateDistance(userLat, userLng, itemLat, itemLng);
        const distanceVal = distanceStr.includes('เมตร') ? parseInt(distanceStr) / 1000 : parseFloat(distanceStr);
        distanceElement.textContent = `ห่างจากคุณ ${distanceStr}`;
        card.dataset.distanceKm = distanceVal;
        if (detailButton) detailButton.dataset.distance = distanceStr;
    });
    window.dispatchEvent(new Event('distancesUpdated'));
}

window.calculateDistance = calculateDistance;
window.updateAllItemDistances = updateAllItemDistances;
window.getUserCoordinates = getUserCoordinates;
window.getRememberedCoordinates = getRememberedCoordinates;
window.saveRememberedCoordinates = saveRememberedCoordinates;
window.requestUserLocation = requestUserLocation;
