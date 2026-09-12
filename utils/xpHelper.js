const db = require('../config/db');

/**
 * เพิ่ม XP ให้ผู้ใช้งาน และปรับ Level อัตโนมัติถ้า XP ถึงเกณฑ์
 * @param {number} userId 
 * @param {number} xpAmount 
 */
function addXP(userId, xpAmount) {
    if (!userId || !xpAmount) return;

    db.query('SELECT xp, level FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err || results.length === 0) return;

        const currentXP = results[0].xp || 0;
        const currentLevel = results[0].level || 1;
        
        const newXP = currentXP + xpAmount;
        // สูตรการคำนวณเลเวล: ทุกๆ 100 XP ได้ 1 เลเวล (0-99 XP = Lv.1, 100-199 XP = Lv.2)
        const newLevel = Math.floor(newXP / 100) + 1;

        db.query('UPDATE users SET xp = ?, level = ? WHERE user_id = ?', [newXP, newLevel, userId], (updateErr) => {
            if (updateErr) console.error('Error updating XP/Level for user', userId, updateErr);
            else if (newLevel > currentLevel) {
                console.log(`🎉 User ${userId} leveled up to Level ${newLevel}!`);
            }
        });
    });
}

module.exports = { addXP };

