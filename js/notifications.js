// ====================================================
// 🔔 notifications.js: จัดการระบบแจ้งเตือนฝั่ง Frontend
// ====================================================

document.addEventListener('DOMContentLoaded', () => {
    const notifDropdownToggle = document.getElementById('notifDropdownToggle');
    const notifBadge = document.getElementById('notifBadge');
    const notifList = document.getElementById('notifList');
    const markAllReadBtn = document.getElementById('markAllReadBtn');

    if (!notifDropdownToggle || !notifList) return;

    function getToken() {
        return localStorage.getItem('authToken');
    }

    async function fetchNotifications() {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.success) {
                renderNotifications(data.notifications, data.unreadCount);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }

    function renderNotifications(notifications, unreadCount) {
        // Update Badge
        if (unreadCount > 0) {
            notifBadge.style.display = 'inline-block';
            notifBadge.innerText = unreadCount;
        } else {
            notifBadge.style.display = 'none';
        }

        // Render List
        if (notifications.length === 0) {
            notifList.innerHTML = '<li><span class="dropdown-item text-muted text-center">ไม่มีการแจ้งเตือน</span></li>';
            return;
        }

        notifList.innerHTML = notifications.map(notif => `
            <li>
                <a class="dropdown-item d-flex flex-column py-2 notif-item ${notif.is_read ? '' : 'bg-light fw-bold'}" 
                   href="#" data-notif-id="${notif.notif_id}" data-notif-type="${notif.type}" data-ref-id="${notif.reference_id}">
                    <span class="text-wrap" style="font-size: 0.9rem;">${escapeHtml(notif.message)}</span>
                    <small class="text-muted" style="font-size: 0.75rem;">${new Date(notif.created_at).toLocaleString('th-TH')}</small>
                </a>
            </li>
            <li><hr class="dropdown-divider m-0"></li>
        `).join('');
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>'"]/g, character => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        })[character]);
    }

    // Handle clicking a notification
    notifList.addEventListener('click', async (e) => {
        const notifItem = e.target.closest('.notif-item');
        if (!notifItem) return;
        e.preventDefault();

        const notifId = notifItem.dataset.notifId;
        const type = notifItem.dataset.notifType;
        const token = getToken();

        // Mark as read
        try {
            await fetch(`/api/notifications/${notifId}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch(err) {}

        // Handle navigation based on type
        if (type === 'request_received') {
            // Owner clicks -> should see "My Items/Sales"
            const mySalesModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('mySalesModal'));
            if (mySalesModal) {
                if (typeof window.loadMySales === 'function') window.loadMySales();
                mySalesModal.show();
            }
        } else if (type === 'request_accepted') {
            // Requester clicks -> should see "My Requests"
            const myRequestsModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('myRequestsModal'));
            if (myRequestsModal) {
                if (typeof window.loadMyRequests === 'function') window.loadMyRequests();
                myRequestsModal.show();
            }
        }

        // Refresh list
        fetchNotifications();
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const token = getToken();
            if(!token) return;
            try {
                await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
            } catch(err) {}
        });
    }

    // Open dropdown logic (refresh when opened)
    notifDropdownToggle.addEventListener('show.bs.dropdown', () => {
        fetchNotifications();
    });

    // Initial fetch if logged in
    fetchNotifications();

    // Poll every 30 seconds
    setInterval(fetchNotifications, 30000);
});
