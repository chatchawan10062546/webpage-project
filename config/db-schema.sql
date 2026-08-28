-- SQL schema สำหรับสร้างตารางฐานข้อมูล MySQL
-- ใช้ร่วมกับ config/db.js ที่เชื่อมต่อฐานข้อมูล pankan_db

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(100),
    item_type ENUM('free', 'sell', 'rent') NOT NULL DEFAULT 'free',
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    status ENUM('available', 'reserved', 'completed') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    requester_id INT NOT NULL,
    message TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_item_requester (item_id, requester_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(user_id) ON DELETE CASCADE
);
