// ====================================================
// 📍 location.js : คำนวณระยะทางจาก GPS จริงของผู้ใช้
// ====================================================

window.currentUserCoordinates = null;
const LOCATION_CACHE_KEY = 'pankanUserCoordinates';

document.addEventListener('DOMContentLoaded', () => {
    getUserCoordinates()
        .then(coordinates => updateAllItemDistances(coordinates.latitude, coordinates.longitude))
        .catch(error => console.warn('ไม่สามารถอ่านตำแหน่งผู้ใช้:', error.message));
});

function getUserCoordinates() {
    const today = new Date().toISOString().slice(0, 10);
    const cached = JSON.parse(localStorage.getItem(LOCATION_CACHE_KEY) || 'null');
    if (cached?.date === today && Number.isFinite(cached.latitude) && Number.isFinite(cached.longitude)) {
        window.currentUserCoordinates = cached;
        return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            position => {
                const coordinates = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    date: today
                };
                localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coordinates));
                window.currentUserCoordinates = coordinates;
                resolve(coordinates);
            },
            () => reject(new Error('กรุณาอนุญาตการเข้าถึงตำแหน่ง')),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 86400000 }
        );
    });
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
        const itemLat = Number(card.dataset.latitude);
        const itemLng = Number(card.dataset.longitude);
        const distanceElement = card.querySelector('.item-distance');
        const detailButton = card.querySelector('.request-btn');

        if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng) || !distanceElement) return;

        const distance = calculateDistance(userLat, userLng, itemLat, itemLng);
        distanceElement.textContent = `ห่างจากคุณ ${distance}`;
        if (detailButton) detailButton.dataset.distance = distance;
    });
}
