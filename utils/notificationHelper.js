const db = require('../config/db');

function createNotification(user_id, sender_id, type, reference_id, message) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO notifications (user_id, sender_id, type, reference_id, message) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [user_id, sender_id || null, type, reference_id || null, message], (err, result) => {
            if (err) {
                console.error('Create Notification Error:', err);
                return reject(err);
            }
            resolve(result.insertId);
        });
    });
}

module.exports = { createNotification };
