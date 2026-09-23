const mysql = require('mysql2');
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'pankan_db'
};

const connection = mysql.createConnection(dbConfig);

const createNotifTable = `
CREATE TABLE IF NOT EXISTS notifications (
    notif_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sender_id INT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id INT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

connection.query(createNotifTable, (err, results) => {
    if (err) {
        console.error("Error creating notifications table:", err);
    } else {
        console.log("Notifications table ready.");
    }
    connection.end();
});
