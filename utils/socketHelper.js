// ====================================================
// ⚡ utils/socketHelper.js : ตัวจัดการ WebSocket (Socket.io)
// ====================================================
let ioInstance = null;

function setIO(io) {
    ioInstance = io;
}

function getIO() {
    return ioInstance;
}

/**
 * ส่งแจ้งเตือน Real-Time ไปยังผู้ใช้เจาะจงรายบุคคล
 * @param {number|string} userId รหัสผู้ใช้ปลายทาง
 * @param {string} eventName ชื่อ Event (เช่น 'new_notification', 'new_chat_message')
 * @param {object} data ข้อมูลที่จะส่ง
 */
function emitToUser(userId, eventName, data) {
    if (ioInstance && userId) {
        ioInstance.to(`user_${userId}`).emit(eventName, data);
    }
}

/**
 * ส่งข้อความ Real-Time เข้าห้องแชตเจาะจง
 * @param {number|string} roomId รหัสห้องแชต
 * @param {string} eventName ชื่อ Event
 * @param {object} data ข้อมูลที่จะส่ง
 */
function emitToRoom(roomId, eventName, data) {
    if (ioInstance && roomId) {
        ioInstance.to(`room_${roomId}`).emit(eventName, data);
    }
}

module.exports = {
    setIO,
    getIO,
    emitToUser,
    emitToRoom
};

