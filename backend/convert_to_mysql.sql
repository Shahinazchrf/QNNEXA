-- Conversion SQLite vers MySQL

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role ENUM('super_admin', 'admin', 'employee', 'client') DEFAULT 'client',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_time INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    max_daily_tickets INT DEFAULT 50,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
);

CREATE TABLE IF NOT EXISTS counters (
    id VARCHAR(36) PRIMARY KEY,
    number INT UNIQUE NOT NULL,
    name VARCHAR(50),
    status ENUM('inactive', 'active', 'busy', 'maintenance') DEFAULT 'inactive',
    current_ticket_id VARCHAR(36) NULL,
    services JSON DEFAULT ('[]'),
    location VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    employee_id VARCHAR(36) NULL,
    INDEX idx_number (number),
    INDEX idx_status (status),
    INDEX idx_employee (employee_id),
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(36) PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL,
    status ENUM('pending', 'waiting', 'called', 'serving', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('normal', 'vip', 'urgent') DEFAULT 'normal',
    estimated_wait_time INT NULL,
    actual_wait_time INT NULL,
    is_vip BOOLEAN DEFAULT FALSE,
    called_at DATETIME NULL,
    served_at DATETIME NULL,
    completed_at DATETIME NULL,
    cancellation_reason VARCHAR(255),
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    client_id VARCHAR(36) NULL,
    service_id VARCHAR(36) NULL,
    counter_id VARCHAR(36) NULL,
    customer_name VARCHAR(100) DEFAULT 'Customer',
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_client (client_id),
    INDEX idx_service (service_id),
    INDEX idx_counter (counter_id),
    INDEX idx_created (createdAt),
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(36) NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_created (createdAt),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS surveys (
    id VARCHAR(36) PRIMARY KEY,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    ticket_id VARCHAR(36) NULL,
    INDEX idx_ticket (ticket_id),
    INDEX idx_rating (rating),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL ON UPDATE CASCADE
);
