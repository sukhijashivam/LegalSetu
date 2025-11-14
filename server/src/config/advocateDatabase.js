// server/src/config/advocateDatabase.js
const { pool } = require('./database');

const initializeAdvocateDatabase = async () => {
  try {
    // First, ensure users table exists (required for foreign keys)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        preferred_language VARCHAR(10) DEFAULT 'en',
        storage_used BIGINT DEFAULT 0,
        max_storage BIGINT DEFAULT 1073741824,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);

    // Advocates table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        bar_council_number VARCHAR(50) UNIQUE NOT NULL,
        experience INT NOT NULL,
        specializations JSON,
        languages JSON,
        education TEXT,
        courts_practicing JSON,
        consultation_fee DECIMAL(10,2) NOT NULL,
        bio TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        profile_photo_url VARCHAR(500),
        document_urls JSON,
        status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
        is_online BOOLEAN DEFAULT FALSE,
        rating DECIMAL(3,2) DEFAULT 0.00,
        total_consultations INT DEFAULT 0,
        total_reviews INT DEFAULT 0,
        last_seen TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_bar_council (bar_council_number),
        INDEX idx_rating (rating),
        INDEX idx_is_online (is_online)
      )
    `);

    // Consultations table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        consultation_type ENUM('chat', 'voice', 'video') DEFAULT 'chat',
        fee_amount DECIMAL(10,2) NOT NULL,
        status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        duration_minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_status (status),
        INDEX idx_started_at (started_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      )
    `);

    // Chat rooms table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        status ENUM('active', 'closed') DEFAULT 'active',
        last_message TEXT,
        last_message_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id),
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      )
    `);

    // Chat messages table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        sender_id INT NOT NULL,
        sender_type ENUM('user', 'advocate') NOT NULL,
        message TEXT NOT NULL,
        message_type ENUM('text', 'image', 'file', 'voice') DEFAULT 'text',
        file_url VARCHAR(500),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_sender (sender_id, sender_type),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE
      )
    `);

    // User chat history table for persistent storage
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_chat_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        consultation_id INT NOT NULL,
        advocate_id INT NOT NULL,
        advocate_name VARCHAR(255) NOT NULL,
        advocate_photo_url VARCHAR(500),
        messages JSON NOT NULL,
        last_message TEXT,
        last_message_time TIMESTAMP NULL,
        message_count INT DEFAULT 0,
        consultation_status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_updated_at (updated_at),
        UNIQUE KEY unique_user_consultation (user_id, consultation_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      )
    `);

    // Advocate reviews table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocate_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultation_id INT NOT NULL,
        user_id INT NOT NULL,
        advocate_id INT NOT NULL,
        rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_review (consultation_id, user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_rating (rating),
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      )
    `);

    // Advocate availability table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS advocate_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        advocate_id INT NOT NULL,
        day_of_week TINYINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_day_of_week (day_of_week),
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE CASCADE
      )
    `);

    // Wallet transactions table (for payment handling)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        advocate_id INT,
        consultation_id INT,
        transaction_type ENUM('credit', 'debit', 'refund') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
        payment_gateway_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_advocate_id (advocate_id),
        INDEX idx_consultation_id (consultation_id),
        INDEX idx_status (status),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (advocate_id) REFERENCES advocates(id) ON DELETE SET NULL,
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Advocate database tables initialized successfully');
  } catch (error) {
    console.error('❌ Advocate database initialization failed:', error);
    throw error;
  }
};

module.exports = { initializeAdvocateDatabase };