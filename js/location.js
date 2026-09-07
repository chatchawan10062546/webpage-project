// ====================================================
// 📍 location.js : คำนวณระยะทางจาก GPS จริงของผู้ใช้
// ====================================================

window.currentUserCoordinates = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        position => {
            window.currentUserCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            updateAllItemDistances(position.coords.latitude, position.coords.longitude);
        },
        error => console.warn('ไม่สามารถอ่านตำแหน่งผู้ใช้:', error.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
});

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
