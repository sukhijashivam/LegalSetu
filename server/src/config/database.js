// server/src/config/database.js
const mysql = require('mysql2/promise');
const fs = require('fs');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL_CA ? {
    ca: fs.readFileSync(process.env.DB_SSL_CA),
    rejectUnauthorized: true
  } : undefined,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 60000,
});

const initializeDatabase = async () => {
  try {
    // Users table
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

    // Documents table with S3 integration
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_url VARCHAR(1000) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        document_type VARCHAR(50) DEFAULT 'legal',
        status ENUM('uploading', 'analyzing', 'completed', 'error') DEFAULT 'uploading',
        extracted_text LONGTEXT,
        confidence DECIMAL(3,2),
        tags JSON,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        analysis_date TIMESTAMP NULL,
        access_count INT DEFAULT 0,
        is_public BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_upload_date (upload_date),
        INDEX idx_s3_key (s3_key)
      )
    `);

    // Document analysis table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS document_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        summary TEXT,
        clauses JSON,
        risks JSON,
        suggestions JSON,
        page_metadata JSON,
        key_value_pairs JSON,
        entities JSON,
        processing_time_ms INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        INDEX idx_document_id (document_id)
      )
    `);

    // Chat sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        document_id INT,
        session_title VARCHAR(255),
        messages JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_updated_at (updated_at)
      )
    `);

    // File processing queue (for handling large files)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS processing_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        priority INT DEFAULT 0,
        attempts INT DEFAULT 0,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        INDEX idx_status (status),
        INDEX idx_priority (priority),
        INDEX idx_created_at (created_at)
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

module.exports = { pool, initializeDatabase };
