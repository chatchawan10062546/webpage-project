SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `room_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (10, 16, 17, 'ผู้ขาย', '[IMAGE]/uploads/1791294240121-chat-671045665.jpg', '2026-10-06 13:44:00', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (11, 16, 14, 'ลูกค้า', 'ครับ', '2026-10-06 13:44:57', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (12, 17, 14, 'ลูกค้า', 'สามารถรับของที่ไหนครับ', '2026-10-16 13:04:15', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (13, 17, 17, 'ผู้ขาย', 'ที่หมู่บ้านเมธาทาวน์โฮม 2  319/14', '2026-10-16 13:08:23', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (14, 17, 17, 'ผู้ขาย', '[IMAGE]/uploads/1792156142504-chat-137505812.jpg', '2026-10-16 13:09:02', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (15, 17, 14, 'ลูกค้า', 'สามารถไปรับได้เวลาไหนบ้างครับ', '2026-10-16 13:10:30', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (16, 17, 17, 'ผู้ขาย', 'ตลอดเวลาเลยครับ', '2026-10-16 13:10:42', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (17, 17, 14, 'ลูกค้า', '[IMAGE]/uploads/1792156253789-chat-294525532.jpg', '2026-10-16 13:10:53', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (18, 17, 14, 'ลูกค้า', 'โอนแล้วนะครับ', '2026-10-16 13:11:05', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (19, 17, 17, 'ผู้ขาย', 'ขอบคุณครับ', '2026-10-16 13:11:11', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (20, 17, 14, 'ลูกค้า', 'ครับ', '2026-10-16 14:33:27', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (21, 17, 17, 'ผู้ขาย', 'ครับ', '2026-10-16 14:47:05', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (22, 18, 14, 'ลูกค้า', 'เดเเเ', '2026-10-17 18:58:44', 1);
INSERT INTO `chat_messages` (`id`, `room_id`, `user_id`, `user_name`, `message`, `created_at`, `is_read`) VALUES (23, 18, 17, 'ผู้ขาย', 'ืะ้้ะเ', '2026-10-17 18:58:55', 1);

DROP TABLE IF EXISTS `chat_room_members`;
CREATE TABLE `chat_room_members` (
  `room_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_room_members_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_room_members_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (15, 14, '2026-09-23 15:45:58');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (15, 17, '2026-09-23 15:45:58');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (16, 14, '2026-10-01 18:28:22');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (16, 17, '2026-10-01 18:28:22');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (17, 14, '2026-10-16 13:03:46');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (17, 17, '2026-10-16 13:03:46');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (18, 14, '2026-10-17 18:58:39');
INSERT INTO `chat_room_members` (`room_id`, `user_id`, `joined_at`) VALUES (18, 17, '2026-10-17 18:58:39');

DROP TABLE IF EXISTS `chat_rooms`;
CREATE TABLE `chat_rooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `item_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `chat_rooms` (`id`, `name`, `created_at`, `item_id`) VALUES (15, 'รายการ: เคสคอม', '2026-09-23 15:45:58', 33);
INSERT INTO `chat_rooms` (`id`, `name`, `created_at`, `item_id`) VALUES (16, 'รายการ: ก๋วยเตี๋ยว', '2026-10-01 18:28:22', 50);
INSERT INTO `chat_rooms` (`id`, `name`, `created_at`, `item_id`) VALUES (17, 'รายการ: ipad', '2026-10-16 13:03:46', 56);
INSERT INTO `chat_rooms` (`id`, `name`, `created_at`, `item_id`) VALUES (18, 'รายการ: ลำโพง', '2026-10-17 18:58:39', 65);

DROP TABLE IF EXISTS `item_images`;
CREATE TABLE `item_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_item_id` (`item_id`),
  CONSTRAINT `item_images_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (1, 59, '/uploads/1792167140448-951436298.jpg', 0, '2026-10-16 16:12:20');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (2, 59, '/uploads/1792167140450-890119028.jpg', 1, '2026-10-16 16:12:20');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (3, 60, '/uploads/1792167184134-411732611.jpg', 0, '2026-10-16 16:13:04');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (4, 60, '/uploads/1792167184134-460693001.jpg', 1, '2026-10-16 16:13:04');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (10, 65, '/uploads/1792258834872-704600229.jpg', 0, '2026-10-17 17:40:34');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (11, 66, '/uploads/1792258879774-621607327.jpg', 0, '2026-10-17 17:41:19');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (12, 67, '/uploads/1792269842208-469607282.png', 0, '2026-10-17 20:44:02');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (13, 67, '/uploads/1792269842213-441476319.png', 1, '2026-10-17 20:44:02');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (14, 67, '/uploads/1792269842219-613352845.png', 2, '2026-10-17 20:44:02');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (15, 67, '/uploads/1792269842222-596096451.png', 3, '2026-10-17 20:44:02');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (16, 67, '/uploads/1792269842225-516168416.png', 4, '2026-10-17 20:44:02');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (17, 68, '/uploads/1792271371239-894233581.jpg', 0, '2026-10-17 21:09:31');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (18, 69, '/uploads/1792271758101-434268244.png', 0, '2026-10-17 21:15:58');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (19, 69, '/uploads/1792271758106-245086874.png', 1, '2026-10-17 21:15:58');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (20, 69, '/uploads/1792271758109-171113548.png', 2, '2026-10-17 21:15:58');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (21, 69, '/uploads/1792271758113-528206893.png', 3, '2026-10-17 21:15:58');
INSERT INTO `item_images` (`id`, `item_id`, `image_url`, `sort_order`, `created_at`) VALUES (22, 69, '/uploads/1792271758116-552256123.png', 4, '2026-10-17 21:15:58');

DROP TABLE IF EXISTS `item_requests`;
CREATE TABLE `item_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','accepted','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `unique_item_requester` (`item_id`,`requester_id`),
  KEY `requester_id` (`requester_id`),
  CONSTRAINT `item_requests_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `item_requests_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `item_requests` (`request_id`, `item_id`, `requester_id`, `message`, `status`, `created_at`, `updated_at`) VALUES (30, 32, 14, 'รับครับ', 'completed', '2026-09-23 15:43:02', '2026-09-23 15:43:43');
INSERT INTO `item_requests` (`request_id`, `item_id`, `requester_id`, `message`, `status`, `created_at`, `updated_at`) VALUES (34, 34, 17, 'สนใจ', 'completed', '2026-09-23 16:31:24', '2026-09-23 16:33:55');
INSERT INTO `item_requests` (`request_id`, `item_id`, `requester_id`, `message`, `status`, `created_at`, `updated_at`) VALUES (39, 36, 14, 'สนใจ', 'completed', '2026-09-23 16:58:29', '2026-09-23 17:06:35');
INSERT INTO `item_requests` (`request_id`, `item_id`, `requester_id`, `message`, `status`, `created_at`, `updated_at`) VALUES (41, 38, 14, 'lllll', 'completed', '2026-09-23 17:21:11', '2026-09-23 17:22:19');
INSERT INTO `item_requests` (`request_id`, `item_id`, `requester_id`, `message`, `status`, `created_at`, `updated_at`) VALUES (42, 56, 14, 'สนใจ\n', 'completed', '2026-10-16 13:01:37', '2026-10-16 13:11:19');

DROP TABLE IF EXISTS `items`;
CREATE TABLE `items` (
  `item_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `status` enum('available','reserved','completed','rejected') DEFAULT 'available',
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `item_type` enum('free','sell','rent') DEFAULT 'free',
  `price` decimal(10,2) DEFAULT 0.00,
  `is_approved` tinyint(1) DEFAULT 0,
  `is_edited` tinyint(1) DEFAULT 0,
  `quantity` int(11) DEFAULT 1,
  `rejection_reason` text DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `deposit` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`item_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (29, 'แป้นพิมพ์', 'อื่นๆ', 'ccc', 'http://localhost:3000/uploads/1789365221287-375559506.webp', 'มมส', '16.2487369', '103.2470179', 'completed', 17, '2026-09-14 05:53:41', 'sell', '1000.00', 1, 0, 1, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (32, 'ก๋วยเตี๋ยว', 'อาหาร', 'ก๋วยเตี๋ยวซื้อมาเกินเลบเอามาแจกยังไม่เสียครับ', '/uploads/1790178077322-432157207.jpg', 'เมธาทาวน์โฮม2    319/14', '16.2328521', '103.2534653', 'completed', 17, '2026-09-23 15:41:17', 'free', '0.00', 1, 0, 0, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (34, 'เคสคอม', 'อื่นๆ', '0000', '/uploads/1790181049910-604977067.jpg', 'มมส', '16.2328521', '103.2534653', 'completed', 14, '2026-09-23 16:30:49', 'sell', '1000.00', 1, 0, 0, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (36, 'ipad', 'อื่นๆ', 'ipad', '/uploads/1790182685548-68561773.jpg', 'มมส', '16.2328521', '103.2534653', 'completed', 17, '2026-09-23 16:58:05', 'sell', '11111.00', 1, 0, 0, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (38, 'ipad', 'อื่นๆ', 'kkk', '/uploads/1790184047730-521909052.jpg', 'มมส', '16.2328521', '103.2534653', 'completed', 17, '2026-09-23 17:20:47', 'sell', '199999.00', 1, 0, 0, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (42, '111', 'อื่นๆ', '1111', '/uploads/1790186390666-902034092.jpg', '1111', '16.2328521', '103.2534653', 'rejected', 14, '2026-09-23 17:59:50', 'sell', '11111.00', 0, 0, 1, '88888', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (43, '1111', 'อื่นๆ', '111', '/uploads/1790186813705-316703894.jpg', '111', '16.2328521', '103.2534653', 'rejected', 14, '2026-09-23 18:06:53', 'sell', '1111.00', 0, 0, 1, 'ไม่ผ่าน', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (52, 'แป้นพิมพ์', 'อาหาร', 'ๆ', '/uploads/1790870323310-750133471.jpg', 'มมส', '16.2328766', '103.2534646', 'rejected', 17, '2026-10-01 15:58:43', 'free', '0.00', 0, 0, 1, 'พเพด', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (53, '111', 'ของใช้', '11', '/uploads/1790881004118-513034444.jpg', '11', '16.2476384', '103.2392979', 'completed', 17, '2026-10-01 18:56:44', 'sell', '111.00', 1, 0, 1, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (55, 'ipad', 'อื่นๆ', 'สารคาม', '/uploads/1792155288118-175356096.jpg', 'มมส', '16.2524177', '103.2341480', 'completed', 17, '2026-10-16 12:54:48', 'sell', '1000.00', 1, 0, 1, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (56, 'ipad', 'อื่นๆ', 'สารคาม', '/uploads/1792155626788-328529355.jpg', 'มมส', '16.2497809', '103.2169819', 'rejected', 17, '2026-10-16 13:00:26', 'sell', '1000.00', 0, 0, 0, 'ลบ', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (57, 'ipad', 'ของใช้', 'aa', '/uploads/1792156527586-874740209.jpg', 'q', '16.2426942', '103.2232475', 'rejected', 17, '2026-10-16 13:15:27', 'sell', '111.00', 0, 0, 1, 'สน', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (59, 'ipod', 'อื่นๆ', 'สารคาม', '/uploads/1792167140448-951436298.jpg', 'มมส', '16.2494513', '103.2192135', 'rejected', 17, '2026-10-16 16:12:20', 'sell', '100.00', 0, 0, 1, 'ไม่ผ่าน', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (60, 'ipod', 'อื่นๆ', 'สารคาม', '/uploads/1792167184134-411732611.jpg', 'มมส', '16.2522529', '103.2037640', 'rejected', 17, '2026-10-16 16:13:04', 'sell', '100.00', 0, 0, 1, 'sefge', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (65, 'ลำโพง', 'ของใช้', 'ลำโพงเสียงดี', '/uploads/1792258834872-704600229.jpg', 'มมส', '16.2286849', '103.2323027', 'completed', 17, '2026-10-17 17:40:34', 'rent', '100.00', 1, 0, 1, NULL, NULL, NULL, '15900.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (66, 'คน', 'ของใช้', 'khbk', '/uploads/1792258879774-621607327.jpg', '11111', NULL, NULL, 'rejected', 17, '2026-10-17 17:41:19', 'sell', '100.00', 0, 0, 1, '][', NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (67, 'แป้นพิมพ์', 'ของใช้', 'แป้นพิมพ์เกมมิ่ง', '/uploads/1792269842208-469607282.png', 'มมส', '16.2499457', '103.2204151', 'completed', 17, '2026-10-17 20:44:02', 'sell', '10.00', 1, 0, 1, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (68, 'ipad', 'ของใช้', 'ssss', '/uploads/1792271371239-894233581.jpg', 'มมส', '16.2507697', '103.2015324', 'completed', 17, '2026-10-17 21:09:31', 'sell', '10.00', 1, 0, 1, NULL, NULL, NULL, '0.00');
INSERT INTO `items` (`item_id`, `title`, `category`, `description`, `image_url`, `location`, `latitude`, `longitude`, `status`, `user_id`, `created_at`, `item_type`, `price`, `is_approved`, `is_edited`, `quantity`, `rejection_reason`, `lat`, `lng`, `deposit`) VALUES (69, 'แป้นพิมพ์', 'ของใช้', 'kk', '/uploads/1792271758101-434268244.png', 'สารคาม', '16.2425294', '103.2065105', 'available', 17, '2026-10-17 21:15:58', 'sell', '10.00', 1, 0, 1, NULL, NULL, NULL, '0.00');

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `notif_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notif_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (1, 17, 14, 'request_received', 39, 'มีผู้ใช้สนใจขอรับ \"ipad\" ของคุณ', 1, '2026-09-23 16:58:29');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (2, 17, 14, 'request_received', 40, 'มีผู้ใช้สนใจขอรับ \"ipad\" ของคุณ', 1, '2026-09-23 17:14:16');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (3, 17, 14, 'request_received', 41, 'มีผู้ใช้สนใจขอรับ \"ipad\" ของคุณ', 1, '2026-09-23 17:21:11');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (4, 14, 17, 'request_accepted', 41, 'คำขอรับของ \"ipad\" ของคุณได้รับการอนุมัติแล้ว', 1, '2026-09-23 17:21:36');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (5, 14, NULL, 'item_rejected', 41, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: ไม่ผ่าน', 1, '2026-09-23 17:52:54');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (6, 14, NULL, 'item_rejected', 41, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: ไม่ผ่าน', 1, '2026-09-23 17:53:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (7, 14, NULL, 'item_rejected', 41, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: ไม่ผ่าน', 1, '2026-09-23 17:59:03');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (8, 14, NULL, 'item_rejected', 42, 'รายการ \"111\" ของคุณไม่อนุมัติ เนื่องจาก: 88888', 1, '2026-09-23 18:00:03');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (9, 14, NULL, 'item_rejected', 43, 'รายการ \"1111\" ของคุณไม่อนุมัติ เนื่องจาก: ไม่ผ่าน', 1, '2026-09-23 18:07:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (10, 17, NULL, 'item_rejected', 52, 'รายการ \"แป้นพิมพ์\" ของคุณไม่อนุมัติ เนื่องจาก: พเพด', 1, '2026-10-01 19:39:39');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (11, 17, 14, 'transaction_update', 3, 'มีผู้ชำระเงินสำหรับสินค้าของคุณแล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-16 12:55:27');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (12, 14, 17, 'transaction_update', 3, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: 12403245) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-16 12:57:36');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (13, 17, 14, 'transaction_update', 3, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ', 1, '2026-10-16 12:58:13');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (14, 17, 16, 'transaction_update', 3, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-16 12:58:55');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (15, 17, 16, 'transaction_update', 2, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-16 12:59:03');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (16, 17, 16, 'transaction_update', 1, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-16 12:59:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (17, 17, 14, 'request_received', 42, 'มีผู้ใช้สนใจขอรับ \"ipad\" ของคุณ', 1, '2026-10-16 13:01:37');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (18, 14, 17, 'request_accepted', 42, 'คำขอรับของ \"ipad\" ของคุณได้รับการอนุมัติแล้ว', 1, '2026-10-16 13:02:01');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (19, 17, NULL, 'item_rejected', 56, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: สส', 1, '2026-10-16 13:14:20');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (20, 17, NULL, 'item_rejected', 56, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: สาส', 1, '2026-10-16 13:14:34');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (21, 17, NULL, 'item_rejected', 56, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: ลบ', 1, '2026-10-16 13:14:42');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (22, 17, NULL, 'item_rejected', 57, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: ลบ', 1, '2026-10-16 13:16:06');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (23, 17, NULL, 'item_rejected', 57, 'รายการ \"ipad\" ของคุณไม่อนุมัติ เนื่องจาก: สน', 1, '2026-10-16 13:16:26');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (24, 17, NULL, 'item_rejected', 59, 'รายการ \"ipod\" ของคุณไม่อนุมัติ เนื่องจาก: ไม่ผ่าน', 1, '2026-10-16 16:13:49');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (25, 17, 14, 'transaction_update', 4, 'มีผู้ชำระเงินสำหรับสินค้าของคุณแล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-16 16:14:36');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (26, 14, 17, 'transaction_update', 4, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: 100000) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-16 16:15:57');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (27, 17, 14, 'transaction_update', 4, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ', 1, '2026-10-16 16:16:35');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (28, 17, 16, 'transaction_update', 4, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-16 16:16:54');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (29, 17, NULL, 'item_rejected', 60, 'รายการ \"ipod\" ของคุณไม่อนุมัติ เนื่องจาก: sefge', 1, '2026-10-16 16:17:35');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (30, 16, 17, 'item_pending', 64, 'มีรายการปล่อยเช่าใหม่ \"เต็นท์สนามกันน้ำ สำหรับออกแคมป์ (ทดสอบรออนุมัติ)\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 17:36:12');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (31, 17, NULL, 'item_approved', 64, 'รายการปล่อยเช่า \"เต็นท์สนามกันน้ำ สำหรับออกแคมป์ (ทดสอบรออนุมัติ)\" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!', 1, '2026-10-17 17:36:12');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (32, 16, 17, 'item_pending', 65, 'มีรายการปล่อยเช่าใหม่ \"ลำโพง\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 17:40:34');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (33, 16, 17, 'item_pending', 66, 'มีรายการขายใหม่ \"คน\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 17:41:19');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (34, 17, NULL, 'item_rejected', 66, 'รายการ \"คน\" ของคุณไม่อนุมัติ เนื่องจาก: ][', 1, '2026-10-17 17:41:40');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (35, 17, NULL, 'item_approved', 65, 'รายการปล่อยเช่า \"ลำโพง\" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!', 1, '2026-10-17 17:41:59');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (36, 17, 14, 'transaction_update', 5, 'มีผู้ชำระเงินสำหรับสินค้าของคุณแล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-17 17:42:56');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (37, 14, 17, 'transaction_update', 5, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: 1000044) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-17 17:44:54');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (38, 17, 14, 'transaction_update', 5, 'ผู้เช่าได้รับสินค้าแล้ว เริ่มต้นระยะเวลาการเช่า', 1, '2026-10-17 17:45:25');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (39, 17, 14, 'transaction_update', 5, 'ผู้เช่าได้แจ้งส่งคืนสินค้าแล้ว (asdfasdf) กรุณาตรวจรับของ', 1, '2026-10-17 17:45:53');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (40, 14, 17, 'transaction_update', 5, 'ผู้ให้เช่าได้รับสินค้าคืนสมบูรณ์แล้ว แอดมินจะดำเนินการโอนเงินมัดจำคืนให้คุณ', 1, '2026-10-17 17:46:28');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (41, 17, 16, 'transaction_update', 5, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-17 17:46:39');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (42, 14, 17, 'transaction_update', 6, 'ผู้ให้เช่าแจ้งพบของชำรุด และขอหักเงินมัดจำ ฿150 เนื่องจาก: เลนส์มีรอยขีดข่วนเล็กน้อย', 1, '2026-10-17 18:42:17');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (43, 16, 17, 'damage_claimed', 6, 'รายการเช่า #6 มีการแจ้งของชำรุด ขอหักมัดจำ ฿150 รอการตรวจสอบ', 0, '2026-10-17 18:42:17');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (44, 17, 14, 'transaction_update', 6, 'ผู้เช่ายินยอมให้หักเงินมัดจำ ฿150 เรียบร้อยแล้ว แอดมินจะดำเนินการโอนเงินตามสัดส่วน', 1, '2026-10-17 18:42:17');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (45, 17, 16, 'transaction_update', 6, 'แอดมินได้โอนค่าเช่าพร้อมค่าชดเชยความเสียหาย (รวม ฿350) สำหรับ \"กล้อง Sony A7 IV พร้อมเลนส์ (สำหรับเช่า)\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 18:42:17');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (46, 14, 16, 'transaction_update', 6, 'แอดมินได้ดำเนินการคืนเงินมัดจำส่วนที่เหลือ ฿150 สำหรับ \"กล้อง Sony A7 IV พร้อมเลนส์ (สำหรับเช่า)\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 18:42:17');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (47, 17, 14, 'transaction_update', 7, 'มีผู้ชำระเงินสำหรับ \"ลำโพง\" แล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-17 18:53:38');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (48, 17, 14, 'transaction_update', 8, 'มีผู้ชำระเงินสำหรับ \"ลำโพง\" แล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-17 18:55:35');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (49, 14, 17, 'transaction_update', 8, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: ุึุภภ) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-17 18:56:19');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (50, 17, 14, 'transaction_update', 8, 'ผู้เช่าได้รับสินค้าแล้ว เริ่มต้นระยะเวลาการเช่า', 1, '2026-10-17 18:56:39');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (51, 17, 14, 'transaction_update', 8, 'ผู้เช่าได้แจ้งส่งคืนสินค้าแล้ว (/ภ-ถภภ/) กรุณาตรวจรับของ', 1, '2026-10-17 18:56:46');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (52, 14, 17, 'transaction_update', 8, 'ผู้ให้เช่าแจ้งพบของชำรุด และขอหักเงินมัดจำ ฿150 เนื่องจาก: ขากล้องหัก', 1, '2026-10-17 18:57:42');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (53, 16, 17, 'damage_claimed', 8, 'รายการเช่า #8 มีการแจ้งของชำรุด ขอหักมัดจำ ฿150 รอการตรวจสอบ', 0, '2026-10-17 18:57:42');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (54, 17, 14, 'transaction_update', 8, 'ผู้เช่ายินยอมให้หักเงินมัดจำ ฿150 เรียบร้อยแล้ว แอดมินจะดำเนินการโอนเงินตามสัดส่วน', 1, '2026-10-17 18:59:13');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (55, 17, 16, 'transaction_update', 8, 'แอดมินได้โอนค่าเช่าพร้อมค่าชดเชยความเสียหาย (รวม ฿650) สำหรับ \"ลำโพง\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 19:20:42');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (56, 14, 16, 'transaction_update', 8, 'แอดมินได้ดำเนินการคืนเงินมัดจำส่วนที่เหลือ ฿15,750 สำหรับ \"ลำโพง\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 19:20:42');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (57, 17, 16, 'transaction_update', 8, 'แอดมินได้โอนค่าเช่าพร้อมค่าชดเชยความเสียหาย (รวม ฿650) สำหรับ \"ลำโพง\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 19:22:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (58, 14, 16, 'transaction_update', 8, 'แอดมินได้ดำเนินการคืนเงินมัดจำส่วนที่เหลือ ฿15,750 สำหรับ \"ลำโพง\" ให้คุณเรียบร้อยแล้ว', 1, '2026-10-17 19:22:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (59, 16, 17, 'item_pending', 67, 'มีรายการขายใหม่ \"แป้นพิมพ์\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 20:44:02');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (60, 17, NULL, 'item_approved', 67, 'รายการขาย \"แป้นพิมพ์\" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!', 1, '2026-10-17 20:44:26');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (61, 17, 14, 'transaction_update', 11, 'มีผู้ชำระเงินสำหรับ \"แป้นพิมพ์\" แล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-17 20:56:45');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (62, 14, 17, 'transaction_update', 11, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: ๅ/-/ภภภภ) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-17 20:57:02');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (63, 17, 14, 'transaction_update', 11, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ', 1, '2026-10-17 20:57:12');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (64, 17, 16, 'transaction_update', 11, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-17 20:57:59');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (65, 16, 17, 'item_pending', 68, 'มีรายการขายใหม่ \"ipad\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 21:09:31');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (66, 17, NULL, 'item_approved', 68, 'รายการขาย \"ipad\" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!', 1, '2026-10-17 21:09:41');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (67, 17, 14, 'transaction_update', 12, 'มีผู้ชำระเงินสำหรับ \"ipad\" แล้ว กรุณาจัดส่งสินค้า', 1, '2026-10-17 21:13:01');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (68, 14, 17, 'transaction_update', 12, 'ผู้ขายจัดส่งสินค้าแล้ว (พัสดุ: 3453453) ตรวจสอบและกดยืนยันเมื่อได้รับของ', 1, '2026-10-17 21:13:11');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (69, 17, 14, 'transaction_update', 12, 'ผู้ซื้อได้รับสินค้าเรียบร้อยแล้ว รอแอดมินโอนเงินให้คุณ', 1, '2026-10-17 21:13:24');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (70, 17, 16, 'transaction_update', 12, 'แอดมินได้ทำการโอนเงินค่าสินค้าให้คุณแล้ว', 1, '2026-10-17 21:13:43');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (71, 16, 17, 'item_pending', 69, 'มีรายการขายใหม่ \"แป้นพิมพ์\" รอการตรวจสอบความปลอดภัยและความถูกต้องจากแอดมิน', 0, '2026-10-17 21:15:58');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (72, 17, NULL, 'item_approved', 69, 'รายการขาย \"แป้นพิมพ์\" ของคุณได้รับการอนุมัติจากแอดมินแล้ว และกำลังแสดงผลบนหน้าเว็บ!', 1, '2026-10-17 21:16:09');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (73, 17, 14, 'transaction_cancelled', 14, 'ผู้ซื้อได้ยกเลิกคำสั่งซื้อสำหรับ \"เคสคอม\" แล้ว', 1, '2026-10-17 21:25:49');
INSERT INTO `notifications` (`notif_id`, `user_id`, `sender_id`, `type`, `reference_id`, `message`, `is_read`, `created_at`) VALUES (74, 17, 14, 'transaction_cancelled', 13, 'ผู้ซื้อได้ยกเลิกคำสั่งซื้อสำหรับ \"แป้นพิมพ์\" แล้ว', 1, '2026-10-17 21:26:17');

DROP TABLE IF EXISTS `reports`;
CREATE TABLE `reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) DEFAULT NULL,
  `reporter_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','resolved') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reported_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`report_id`),
  KEY `item_id` (`item_id`),
  KEY `reporter_id` (`reporter_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reports` (`report_id`, `item_id`, `reporter_id`, `reason`, `status`, `created_at`, `reported_user_id`) VALUES (5, 56, 14, '[สแปม / ก่อกวน] สส', 'resolved', '2026-10-16 13:13:56', 17);
INSERT INTO `reports` (`report_id`, `item_id`, `reporter_id`, `reason`, `status`, `created_at`, `reported_user_id`) VALUES (6, 57, 14, '[หลอกลวง / มิจฉาชีพ] ddd', 'resolved', '2026-10-16 13:15:49', 17);
INSERT INTO `reports` (`report_id`, `item_id`, `reporter_id`, `reason`, `status`, `created_at`, `reported_user_id`) VALUES (8, 60, 14, '[สแปม / ก่อกวน] fff', 'resolved', '2026-10-16 16:17:29', 17);
INSERT INTO `reports` (`report_id`, `item_id`, `reporter_id`, `reason`, `status`, `created_at`, `reported_user_id`) VALUES (9, NULL, 14, '[อื่นๆ] ระบบค้าง', 'resolved', '2026-10-16 16:30:23', NULL);
INSERT INTO `reports` (`report_id`, `item_id`, `reporter_id`, `reason`, `status`, `created_at`, `reported_user_id`) VALUES (10, NULL, 14, '[สินค้าผิดกฎหมาย] cwfc', 'resolved', '2026-10-16 22:28:55', NULL);

DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) DEFAULT NULL,
  `reviewer_id` int(11) NOT NULL,
  `reviewee_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`review_id`),
  KEY `item_id` (`item_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `reviewee_id` (`reviewee_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE SET NULL,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (13, 32, 14, 17, 5, 'อร่อยมากครับ', '2026-09-23 15:43:52');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (14, NULL, 17, 14, 5, 'สวยมากครับ', '2026-09-23 15:47:07');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (15, 34, 17, 14, 5, 'ฟฟฟฟ', '2026-09-23 16:33:57');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (16, 36, 14, 17, 5, 'หหห', '2026-09-23 17:06:39');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (17, 38, 14, 17, 5, '7777', '2026-09-23 17:22:22');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (18, 55, 14, 17, 5, 'hhhh', '2026-10-16 12:58:26');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (19, 56, 14, 17, 5, 'ของตรงปกติมากครับ', '2026-10-16 13:11:35');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (20, 60, 14, 17, 5, 'ddd', '2026-10-16 16:16:43');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (21, 67, 14, 17, 5, 'ดี', '2026-10-17 20:57:25');
INSERT INTO `reviews` (`review_id`, `item_id`, `reviewer_id`, `reviewee_id`, `rating`, `comment`, `created_at`) VALUES (22, 68, 14, 17, 5, 'asdasd', '2026-10-17 21:13:28');

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `trans_id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `giver_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('awaiting_payment','paid','awaiting_shipment','shipped','received','released','completed','cancelled','refunded','disputed') NOT NULL DEFAULT 'awaiting_payment',
  `payment_status` enum('pending','held','released','refunded','failed') NOT NULL DEFAULT 'pending',
  `shipping_status` enum('pending','shipped','delivered') NOT NULL DEFAULT 'pending',
  `payment_reference` varchar(255) DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `received_at` timestamp NULL DEFAULT NULL,
  `release_at` timestamp NULL DEFAULT NULL,
  `released_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `admin_slip` varchar(500) DEFAULT NULL,
  `rental_start_date` date DEFAULT NULL,
  `deposit_amount` decimal(10,2) DEFAULT 0.00,
  `rental_status` varchar(50) DEFAULT NULL,
  `rental_days` int(11) DEFAULT 0,
  `deposit_refund_slip` varchar(255) DEFAULT NULL,
  `rental_end_date` date DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `return_tracking` varchar(255) DEFAULT NULL,
  `claim_amount` decimal(10,2) DEFAULT 0.00,
  `claim_reason` text DEFAULT NULL,
  `claim_image` varchar(255) DEFAULT NULL,
  `claim_status` enum('none','pending','accepted','rejected','settled') DEFAULT 'none',
  `claim_admin_decision` text DEFAULT NULL,
  `trans_ref` varchar(100) DEFAULT NULL,
  `is_slip_verified` tinyint(1) DEFAULT 0,
  `slip_verified_at` timestamp NULL DEFAULT NULL,
  `slip_raw_data` longtext DEFAULT NULL,
  PRIMARY KEY (`trans_id`),
  KEY `item_id` (`item_id`),
  KEY `giver_id` (`giver_id`),
  KEY `receiver_id` (`receiver_id`),
  KEY `idx_transactions_release` (`status`,`release_at`),
  KEY `transactions_request_fk` (`request_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`item_id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`giver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `transactions_request_fk` FOREIGN KEY (`request_id`) REFERENCES `item_requests` (`request_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (1, 29, NULL, 17, 14, '1000.00', 'completed', 'released', 'delivered', '/uploads/1792155549010-admin-slip.jpg', NULL, '2026-10-01 16:22:56', NULL, '2026-10-01 17:02:32', NULL, '2026-10-01 17:02:32', '2026-10-01 16:22:13', '2026-10-16 16:22:31', '/uploads/1792155549010-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (2, 53, NULL, 17, 14, '111.00', 'completed', 'released', 'delivered', '/uploads/1792155543292-admin-slip.jpg', 'กำลัง', '2026-10-01 19:10:57', '2026-10-01 19:11:20', '2026-10-01 19:11:52', '2026-10-03 19:11:20', '2026-10-01 19:11:52', '2026-10-01 18:57:14', '2026-10-16 16:22:31', '/uploads/1792155543292-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (3, 55, NULL, 17, 14, '1000.00', 'completed', 'released', 'delivered', '/uploads/1792155535930-admin-slip.jpg', '12403245', '2026-10-16 12:55:27', '2026-10-16 12:57:36', NULL, '2026-10-18 12:57:36', '2026-10-16 12:58:13', '2026-10-16 12:55:17', '2026-10-16 16:22:31', '/uploads/1792155535930-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (4, 60, NULL, 17, 14, '100.00', 'completed', 'released', 'delivered', '/uploads/1792167414293-admin-slip.jpg', '100000', '2026-10-16 16:14:36', '2026-10-16 16:15:57', NULL, '2026-10-18 16:15:57', '2026-10-16 16:16:35', '2026-10-16 16:14:18', '2026-10-16 16:22:31', '/uploads/1792167414293-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (5, 65, NULL, 17, 14, '16000.00', 'completed', 'released', 'delivered', '/uploads/1792259199311-admin-slip.jpg', '1000044', '2026-10-17 17:42:55', '2026-10-17 17:44:54', NULL, '2026-10-19 17:44:54', '2026-10-17 17:46:28', '2026-10-17 17:42:28', '2026-10-17 17:46:39', '/uploads/1792259199311-admin-slip.jpg', '2026-10-17 17:00:00', '15900.00', 'returned', 1, NULL, '2026-10-18 17:00:00', '2026-10-17 17:45:53', 'asdfasdf', '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (8, 65, NULL, 17, 14, '16400.00', 'completed', 'released', 'delivered', '/uploads/1792263335443-buyer-slip.jpg', 'ุึุภภ', '2026-10-17 18:55:35', '2026-10-17 18:56:19', NULL, '2026-10-19 18:56:19', '2026-10-17 19:22:09', '2026-10-17 18:55:30', '2026-10-17 19:40:47', '/uploads/1792264929396-owner-payout-slip.jpg', '2026-10-17 17:00:00', '15900.00', 'returned', 5, '/uploads/1792264929396-renter-refund-slip.jpg', '2026-10-22 17:00:00', '2026-10-17 18:56:46', '/ภ-ถภภ/', '150.00', 'ขากล้องหัก', '/uploads/1792263462296-damage.jpg', 'settled', 'ผู้เช่ายินยอมให้หักเงินมัดจำตามที่ผู้ให้เช่าร้องขอ แอดมินดำเนินการโอนเงินตามสัดส่วนเรียบร้อยแล้ว', NULL, 0, NULL, NULL);
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (11, 67, NULL, 17, 14, '10.00', 'completed', 'released', 'delivered', '/uploads/1792270679889-admin-slip.jpg', 'ๅ/-/ภภภภ', '2026-10-17 20:56:45', '2026-10-17 20:57:02', NULL, '2026-10-19 20:57:02', '2026-10-17 20:57:12', '2026-10-17 20:44:54', '2026-10-17 20:57:59', '/uploads/1792270679889-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, '629103869374I000005B9790', 1, '2026-10-17 20:56:45', '{\"success\":true,\"data\":{\"success\":true,\"message\":\"✅\",\"language\":null,\"transRef\":\"629103869374I000005B9790\",\"sendingBank\":\"030\",\"receivingBank\":\"004\",\"transDate\":\"20261018\",\"transTime\":\"03:56:15\",\"transTimestamp\":\"2026-10-17T20:56:15.000Z\",\"sender\":{\"displayName\":\"นาย ชัชวาล ส\",\"name\":null,\"proxy\":{\"type\":null,\"value\":null},\"account\":{\"type\":\"BANKAC\",\"value\":\"0204xxxx0657\"}},\"receiver\":{\"displayName\":\"นาย ชัชวาล ส\",\"name\":\"MR. CHATCHAWAN S\",\"proxy\":{\"type\":null,\"value\":null},\"account\":{\"type\":\"BANKAC\",\"value\":\"09xxxx1179\"}},\"amount\":10,\"paidLocalAmount\":null,\"paidLocalCurrency\":null,\"countryCode\":\"TH\",\"transFeeAmount\":null,\"ref1\":null,\"ref2\":null,\"ref3\":null,\"toMerchantId\":null,\"qrcodeData\":\"0045000600000101030300224629103869374I000005B97905102TH9104BE53\"}}');
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (12, 68, NULL, 17, 14, '10.00', 'completed', 'released', 'delivered', '/uploads/1792271623607-admin-slip.jpg', '3453453', '2026-10-17 21:13:01', '2026-10-17 21:13:11', NULL, '2026-10-19 21:13:11', '2026-10-17 21:13:24', '2026-10-17 21:09:52', '2026-10-17 21:13:43', '/uploads/1792271623607-admin-slip.jpg', NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, '629104870343I000005B9790', 1, '2026-10-17 21:13:01', '{\"success\":true,\"data\":{\"success\":true,\"message\":\"✅\",\"language\":null,\"transRef\":\"629104870343I000005B9790\",\"sendingBank\":\"030\",\"receivingBank\":\"004\",\"transDate\":\"20261018\",\"transTime\":\"04:11:56\",\"transTimestamp\":\"2026-10-17T21:11:56.000Z\",\"sender\":{\"displayName\":\"นาย ชัชวาล ส\",\"name\":null,\"proxy\":{\"type\":null,\"value\":null},\"account\":{\"type\":\"BANKAC\",\"value\":\"0204xxxx0657\"}},\"receiver\":{\"displayName\":\"นาย ชัชวาล ส\",\"name\":\"MR. CHATCHAWAN S\",\"proxy\":{\"type\":null,\"value\":null},\"account\":{\"type\":\"BANKAC\",\"value\":\"09xxxx1179\"}},\"amount\":10,\"paidLocalAmount\":null,\"paidLocalCurrency\":null,\"countryCode\":\"TH\",\"transFeeAmount\":null,\"ref1\":null,\"ref2\":null,\"ref3\":null,\"toMerchantId\":null,\"qrcodeData\":\"0045000600000101030300224629104870343I000005B97905102TH9104B41C\"}}');
INSERT INTO `transactions` (`trans_id`, `item_id`, `request_id`, `giver_id`, `receiver_id`, `amount`, `status`, `payment_status`, `shipping_status`, `payment_reference`, `tracking_number`, `paid_at`, `shipped_at`, `received_at`, `release_at`, `released_at`, `created_at`, `updated_at`, `admin_slip`, `rental_start_date`, `deposit_amount`, `rental_status`, `rental_days`, `deposit_refund_slip`, `rental_end_date`, `returned_at`, `return_tracking`, `claim_amount`, `claim_reason`, `claim_image`, `claim_status`, `claim_admin_decision`, `trans_ref`, `is_slip_verified`, `slip_verified_at`, `slip_raw_data`) VALUES (13, 69, NULL, 17, 14, '10.00', 'cancelled', 'pending', 'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-17 21:16:16', '2026-10-17 21:26:17', NULL, NULL, '0.00', NULL, 0, NULL, NULL, NULL, NULL, '0.00', NULL, NULL, 'none', NULL, NULL, 0, NULL, NULL);

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_email_verified` tinyint(1) DEFAULT 0,
  `otp_code` varchar(10) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `auth_provider` enum('local','google') DEFAULT 'local',
  `google_id` varchar(255) DEFAULT NULL,
  `is_banned` tinyint(1) DEFAULT 0,
  `xp` int(11) DEFAULT 0,
  `level` int(11) DEFAULT 1,
  `promptpay_number` varchar(20) DEFAULT NULL,
  `promptpay_name` varchar(100) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `is_email_verified`, `otp_code`, `otp_expires_at`, `auth_provider`, `google_id`, `is_banned`, `xp`, `level`, `promptpay_number`, `promptpay_name`, `reset_token`, `reset_token_expires`) VALUES (14, 'ลูกค้า', '66010914138@msu.ac.th', '$2b$10$R9xdt/2Nkip3yoWacdnZGuUvv6ECoQhcEDqF4gwKihDz/eTqP.L0m', '0832347546', 'user', '2026-09-12 13:52:33', 1, NULL, NULL, 'local', NULL, 0, 180, 2, NULL, NULL, '25b45db25e7b175115dd6d3ec1618b781e87bb294f27880d38d8bfbe61337b58', '2026-10-17 21:07:25');
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `is_email_verified`, `otp_code`, `otp_expires_at`, `auth_provider`, `google_id`, `is_banned`, `xp`, `level`, `promptpay_number`, `promptpay_name`, `reset_token`, `reset_token_expires`) VALUES (16, 'admin', 'chatchawan10062546@gmail.com', NULL, NULL, 'admin', '2026-09-12 14:30:08', 1, NULL, NULL, 'google', '102443711704535814664', 0, 0, 1, NULL, NULL, NULL, NULL);
INSERT INTO `users` (`user_id`, `name`, `email`, `password`, `phone`, `role`, `created_at`, `is_email_verified`, `otp_code`, `otp_expires_at`, `auth_provider`, `google_id`, `is_banned`, `xp`, `level`, `promptpay_number`, `promptpay_name`, `reset_token`, `reset_token_expires`) VALUES (17, 'ผู้ขาย', 'chachwalsinghthes@gmail.com', NULL, '0832347546', 'user', '2026-09-12 15:31:44', 1, NULL, NULL, 'google', '104736210982900812967', 0, 490, 5, '0832347546', 'ชัชวาล สิงห์เทศ', NULL, NULL);

SET FOREIGN_KEY_CHECKS = 1;
