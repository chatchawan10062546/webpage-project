// ====================================================
// 🔔 js/navBadges.js : อัปเดตตัวเลขแจ้งเตือนทุกเมนูบน Navbar แบบเรียลไทม์
// ====================================================

window.updateAllNavBadges = async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/user-badges', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.badges) return;

        const b = data.badges;

        // 1. ตัวเลขแชตที่ยังไม่ได้อ่าน
        const chatBadge = document.getElementById('chatUnreadBadge');
        if (chatBadge) {
            if (b.chat > 0) {
                chatBadge.textContent = b.chat;
                chatBadge.style.display = 'inline-block';
            } else {
                chatBadge.style.display = 'none';
            }
        }

        // 2. ตัวเลขกระดิ่งแจ้งเตือน
        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            if (b.notifications > 0) {
                notifBadge.textContent = b.notifications;
                notifBadge.style.display = 'inline-block';
            } else {
                notifBadge.style.display = 'none';
            }
        }

        // 3. รายการนัดรับ / ขอของฟรี (คนซื้อ)
        const reqBadge = document.getElementById('myRequestsBadge');
        if (reqBadge) {
            if (b.myRequests > 0) {
                reqBadge.textContent = b.myRequests;
                reqBadge.style.display = 'inline-block';
            } else {
                reqBadge.style.display = 'none';
            }
        }

        // 4. การส่งมอบของฉัน (คนขาย)
        const salesBadge = document.getElementById('mySalesBadge');
        if (salesBadge) {
            if (b.mySales > 0) {
                salesBadge.textContent = b.mySales;
                salesBadge.style.display = 'inline-block';
            } else {
                salesBadge.style.display = 'none';
            }
        }

        // 5. ประวัติคนกลาง (ธุรกรรม)
        const txBadge = document.getElementById('navTransactionsBadge');
        if (txBadge) {
            if (b.transactions > 0) {
                txBadge.textContent = b.transactions;
                txBadge.style.display = 'inline-block';
            } else {
                txBadge.style.display = 'none';
            }
        }
    } catch (err) {
        // เงียบไว้เมื่อเกิด network error ชั่วคราว
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window.updateAllNavBadges();
    // รีเฟรชอัตโนมัติทุกๆ 15 วินาที
    setInterval(() => {
        window.updateAllNavBadges();
    }, 15000);
});
