//merged file
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

const router = express.Router();

// MySQL Pool configuration (merged settings)
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

// Database connection verification with retry logic (from both versions)
const verifyConnection = async (attempt = 1) => {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database');
    conn.release();
  } catch (err) {
    console.error(`Connection attempt ${attempt} failed:`, err.message);
    if (attempt < 3) {
      console.log(`Retrying connection in 5 seconds...`);
      setTimeout(() => verifyConnection(attempt + 1), 5000);
    } else {
      console.error('Failed to connect after 3 attempts');
      process.exit(1);
    }
  }
};

// Combined keep-alive and error handling
// Making sure the backend is running
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Keep-alive query successful');
  } catch (err) {
    console.error('Keep-alive query failed:', err.message);
  }
}, 5 * 60 * 1000);

pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('Connection error:', err.message);
  });
});

// Initialize connection
verifyConnection();

// Chat Header Endpoints (from your version)
router.get('/chat-header/:lang', async (req, res) => {
  const { lang } = req.params;
  const headerKeys = [
    crypto.createHash('sha256').update('chat_header_title').digest('hex'),
    crypto.createHash('sha256').update('chat_header_subtitle').digest('hex')
  ];

  try {
    const [rows] = await pool.execute(
      `SELECT translated_text FROM translations 
       WHERE source_text_hash IN (?, ?) 
       AND target_lang = ?`,
      [headerKeys[0], headerKeys[1], lang]
    );

    const result = {
      title: 'Legal Assistant',
      subtitle: 'Online • Ready to help'
    };

    if (rows.length > 0) {
      result.title = rows[0].translated_text;
      if (rows.length > 1) result.subtitle = rows[1].translated_text;
    }

    res.json(result);
  } catch (err) {
    console.error('Chat header fetch error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch chat header',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});

router.post('/chat-header', async (req, res) => {
  const { lang, title, subtitle } = req.body;
  
  if (!lang || !title || !subtitle) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const titleHash = crypto.createHash('sha256').update('chat_header_title').digest('hex');
  const subtitleHash = crypto.createHash('sha256').update('chat_header_subtitle').digest('hex');

  try {
    await pool.query(
      `REPLACE INTO translations 
       (source_text_hash, source_lang, target_lang, translated_text) 
       VALUES (?, 'en', ?, ?), (?, 'en', ?, ?)`,
      [titleHash, lang, title, subtitleHash, lang, subtitle]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Chat header save error:', err);
    res.status(500).json({ 
      error: 'Failed to save chat header',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
  }
});

// Merged Translation Endpoint (both versions' features)
router.post('/translate', async (req, res) => {
  const { text, targetLang, sourceLang = 'en' } = req.body;

  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const hash = crypto.createHash('sha256').update(text, 'utf8').digest('hex');

  try {
    // Check cache with connection recovery
    const [cached] = await pool.execute(
      `SELECT translated_text FROM translations
       WHERE source_text_hash = ?
       AND source_lang = ?
       AND target_lang = ?
       LIMIT 1`,
      [hash, sourceLang, targetLang]
    );

    if (cached.length > 0) {
      await pool.execute(
        `UPDATE translations
         SET last_used = CURRENT_TIMESTAMP
         WHERE source_text_hash = ?`,
        [hash]
      );

      return res.json({
        translation: cached[0].translated_text,
        cached: true
      });
    }

    // Google Translate API call with timeout
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2`,
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: "text"
      },
      {
        params: { key: process.env.GOOGLE_API_KEY },
        timeout: 5000
      }
    );

    if (!response.data?.data?.translations?.[0]?.translatedText) {
      throw new Error('Invalid API response structure');
    }

    const translated = response.data.data.translations[0].translatedText;

    // Combined insert logic with retry and duplicate handling
    let retries = 3;
    while (retries > 0) {
      try {
        await pool.execute(
          `INSERT INTO translations
           (source_text_hash, source_lang, target_lang, translated_text)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           translated_text = VALUES(translated_text),
           last_used = CURRENT_TIMESTAMP`,
          [hash, sourceLang, targetLang, translated]
        );
        break;
      } catch (err) {
        retries--;
        if (err.code === 'ER_DUP_ENTRY' || retries === 0) {
          const [existing] = await pool.execute(
            `SELECT translated_text FROM translations
             WHERE source_text_hash = ? AND source_lang = ? AND target_lang = ?`,
            [hash, sourceLang, targetLang]
          );
          return res.json({
            translation: existing[0]?.translated_text || translated,
            cached: true
          });
        }
        console.log(`Retrying insert (${retries} attempts remaining)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    res.json({
      translation: translated,
      cached: false
    });
  } catch (err) {
    console.error('Translation error:', err);
    
    // Connection recovery logic
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Attempting to reconnect to database...');
      await verifyConnection();
    }

    res.status(500).json({
      error: 'Translation failed',
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    });
  }
});

module.exports = router;
// Included UptimeRobot to keep the monitor up