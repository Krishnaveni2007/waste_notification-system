CREATE DATABASE IF NOT EXISTS waste_monitoring;
USE waste_monitoring;

CREATE TABLE IF NOT EXISTS residents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    door_number VARCHAR(50) UNIQUE NOT NULL,
    warning_count INT DEFAULT 0,
    strict_warning TINYINT(1) DEFAULT 0,
    fine_status ENUM('NULL', 'Pending', 'Paid') DEFAULT 'NULL',
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    head_message_active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS violations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT,
    photo_path VARCHAR(255),
    waste_type VARCHAR(50) DEFAULT 'Mixed Waste',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS head (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_data TEXT, -- Stores the QR code data for payment
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed data for residents (optional, but good for testing)
INSERT IGNORE INTO residents (name, door_number) VALUES 
('John Doe', '101'),
('Jane Smith', '202'),
('Alice Brown', '303');

-- Seed Head data with a dummy UPI or payment link for QR generation
INSERT IGNORE INTO head (id, qr_data) VALUES (1, 'upi://pay?pa=head@upi&pn=ApartmentHead&am=500&cu=INR');
