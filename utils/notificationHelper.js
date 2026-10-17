const db = require('../config/db');
const { emitToUser } = require('./socketHelper');

function createNotification(user_id, sender_id, type, reference_id, message) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [user_id, sender_id || null, type, reference_id || null, message], (err, result) => {
            if (err) {
                console.error('Create Notification Error:', err);
                return reject(err);
            }
            const notifId = result.insertId;
            
            // ⚡ ยิงแจ้งเตือน Real-Time ทันทีไปยังผู้ใช้ปลายทาง
            try {
                emitToUser(user_id, 'new_notification', {
                    notif_id: notifId,
                    user_id,
                    sender_id,
                    type,
                    reference_id,
                    message,
                    created_at: new Date()
                });
            } catch (e) {
                console.error('Real-Time Notification Emit Error:', e);
            }

            resolve(notifId);
        });
    });
}

module.exports = { createNotification };
