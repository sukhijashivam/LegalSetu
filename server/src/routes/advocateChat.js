// server/src/routes/advocateChat.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { s3 } = require('../config/s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

// Enhanced authentication middleware for production
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided in advocate chat');
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    console.log('🔍 Advocate chat - verifying token...');
    
    // Try Firebase token first (simple decode without verification for development)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        console.log('🔍 Token payload check:', {
          hasEmail: !!payload.email,
          email: payload.email,
          hasIss: !!payload.iss,
          exp: payload.exp,
          iat: payload.iat
        });
        
        // Basic validation for Firebase token
        if (payload.email && payload.iss && payload.iss.includes('securetoken.google.com')) {
          console.log('✅ Firebase-like token detected for:', payload.email);
          
          // Check if user exists in database
          const [users] = await pool.execute(
            'SELECT id, email, name FROM users WHERE email = ?',
            [payload.email]
          );
          
          if (users.length === 0) {
            console.log('🆕 Creating new user for advocate chat:', payload.email);
            // Create user if doesn't exist - with default password
            try {
              const [result] = await pool.execute(
                'INSERT INTO users (email, name, preferred_language, password) VALUES (?, ?, ?, ?)',
                [payload.email, payload.name || payload.email.split('@')[0], 'en', 'firebase_user']
              );
              
              req.user = {
                userId: result.insertId,
                email: payload.email,
                name: payload.name || payload.email.split('@')[0],
                type: 'user'
              };
              console.log('✅ New user created for advocate chat:', result.insertId);
            } catch (dbError) {
              console.error('❌ Database error creating user:', dbError);
              return res.status(500).json({ 
                success: false, 
                error: 'Failed to create user account' 
              });
            }
          } else {
            req.user = {
              userId: users[0].id,
              email: users[0].email,
              name: users[0].name,
              type: 'user'
            };
            console.log('✅ Existing user found for advocate chat:', users[0].id);
          }
          
          return next();
        }
      }
    } catch (firebaseError) {
      console.log('🔄 Firebase token parsing failed:', firebaseError.message);
    }

    // Try JWT token
    console.log('🔄 Trying JWT verification...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    console.log('✅ JWT token decoded:', { userId: decoded.userId, advocateId: decoded.advocateId, type: decoded.type });
    
    // Check if it's a user token or advocate token
    if (decoded.userId) {
      // This is a regular user token
      const [users] = await pool.execute(
        'SELECT id, email, name FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (users.length === 0) {
        console.log('❌ JWT User not found in database');
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      
      req.user = { 
        userId: users[0].id,
        email: users[0].email,
        name: users[0].name,
        type: 'user'
      };
      console.log('✅ JWT user authenticated for advocate chat:', users[0].id);
    } else if (decoded.advocateId) {
      // This is an advocate token
      const [advocates] = await pool.execute(
        'SELECT id, full_name, email FROM advocates WHERE id = ?',
        [decoded.advocateId]
      );
      
      if (advocates.length === 0) {
        console.log('❌ JWT Advocate not found in database');
        return res.status(401).json({ success: false, error: 'Advocate not found' });
      }
      
      req.user = { 
        advocateId: advocates[0].id,
        email: advocates[0].email,
        name: advocates[0].full_name,
        type: 'advocate'
      };
      console.log('✅ JWT advocate authenticated for advocate chat:', advocates[0].id);
    } else {
      console.log('❌ Invalid JWT token structure');
      return res.status(401).json({ success: false, error: 'Invalid token structure' });
    }
    
    next();
  } catch (error) {
    console.error('❌ Advocate chat authentication error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed. Please login again.' 
    });
  }
};

// Helper function to safely parse JSON with better error handling
const safeJsonParse = (jsonString, fallback = []) => {
  if (!jsonString || jsonString === null || jsonString === undefined || jsonString === '') {
    return fallback;
  }
  
  // If it's already an array, return it
  if (Array.isArray(jsonString)) {
    return jsonString;
  }
  
  // If it's a string that looks like a comma-separated list, parse it
  if (typeof jsonString === 'string') {
    // Check if it's already JSON
    if (jsonString.startsWith('[') && jsonString.endsWith(']')) {
      try {
        const parsed = JSON.parse(jsonString);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch (error) {
        console.warn('⚠️ Failed to parse JSON array:', jsonString, 'Error:', error.message);
        return fallback;
      }
    }
    
    // If it's a comma-separated string, split it
    if (jsonString.includes(',')) {
      return jsonString.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }
    
    // If it's a single item, return as array
    if (jsonString.trim().length > 0) {
      return [jsonString.trim()];
    }
  }
  
  return fallback;
};

// Helper function to generate pre-signed URLs for S3 objects with proper URL decoding
const generatePresignedUrl = async (s3Url) => {
  if (!s3Url || !s3Url.includes('amazonaws.com')) {
    return s3Url; // Return as-is if not an S3 URL
  }
  
  try {
    // Extract bucket and key from S3 URL
    const url = new URL(s3Url);
    const pathParts = url.pathname.substring(1).split('/');
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    
    // Decode URL-encoded characters in the key
    const key = decodeURIComponent(pathParts.join('/'));
    
    console.log('🔗 Generating pre-signed URL for:', { bucket, key, originalUrl: s3Url });
    
    const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }), { expiresIn: 3600 }); // 1 hour expiry
    
    console.log('✅ Pre-signed URL generated successfully');
    return presignedUrl;
  } catch (error) {
    console.error('❌ Error generating pre-signed URL:', error);
    return s3Url; // Return original URL as fallback
  }
};

// Helper function to save/update user chat history
const saveUserChatHistory = async (userId, consultationId, advocateId, advocateName, advocatePhotoUrl, messages) => {
  try {
    const lastMessage = messages.length > 0 ? messages[messages.length - 1].message : null;
    const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].created_at : null;
    
    // Get consultation status
    const [consultations] = await pool.execute(
      'SELECT status FROM consultations WHERE id = ?',
      [consultationId]
    );
    
    const consultationStatus = consultations.length > 0 ? consultations[0].status : 'active';
    
    // Ensure messages is properly serialized as JSON
    let messagesJson;
    try {
      // If messages is already a string, check if it's valid JSON
      if (typeof messages === 'string') {
        // Test if it's valid JSON by parsing it
        JSON.parse(messages);
        messagesJson = messages;
      } else {
        // Otherwise stringify the object/array
        messagesJson = JSON.stringify(messages);
      }
    } catch (jsonError) {
      console.error('❌ Invalid JSON for messages, using empty array:', jsonError);
      messagesJson = '[]';
    }
    
    await pool.execute(`
      INSERT INTO user_chat_history (
        user_id, consultation_id, advocate_id, advocate_name, advocate_photo_url,
        messages, last_message, last_message_time, message_count, consultation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        messages = VALUES(messages),
        last_message = VALUES(last_message),
        last_message_time = VALUES(last_message_time),
        message_count = VALUES(message_count),
        consultation_status = VALUES(consultation_status),
        updated_at = CURRENT_TIMESTAMP
    `, [
      userId, consultationId, advocateId, advocateName, advocatePhotoUrl,
      messagesJson, lastMessage, lastMessageTime, messages.length, consultationStatus
    ]);
    
    console.log('✅ User chat history saved for user:', userId, 'consultation:', consultationId);
  } catch (error) {
    console.error('❌ Error saving user chat history:', error);
  }
};

// Get user's chat history
router.get('/user-chat-history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (req.user.type !== 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only users can access chat history'
      });
    }

    console.log('📚 Fetching chat history for user:', userId);

    const [chatHistory] = await pool.execute(`
      SELECT 
        uch.*,
        a.is_online as advocate_is_online,
        a.rating as advocate_rating,
        a.consultation_fee
      FROM user_chat_history uch
      LEFT JOIN advocates a ON uch.advocate_id = a.id
      WHERE uch.user_id = ?
      ORDER BY uch.updated_at DESC
    `, [userId]);

    // Generate pre-signed URLs for advocate photos
    const historyWithPresignedUrls = await Promise.all(
      chatHistory.map(async (chat) => {
        try {
          const advocatePhotoUrl = chat.advocate_photo_url 
            ? await generatePresignedUrl(chat.advocate_photo_url)
            : null;
          
          let parsedMessages = [];
          try {
            // Safely parse messages JSON
            parsedMessages = typeof chat.messages === 'string' 
              ? JSON.parse(chat.messages) 
              : (Array.isArray(chat.messages) ? chat.messages : []);
          } catch (parseError) {
            console.error('❌ Error parsing messages JSON:', parseError);
            console.log('Problem value:', chat.messages);
            parsedMessages = [];
          }

          return {
            ...chat,
            advocate_photo_url: advocatePhotoUrl,
            messages: parsedMessages
          };
        } catch (error) {
          console.error('❌ Error processing chat history item:', error);
          return {
            ...chat,
            advocate_photo_url: null,
            messages: []
          };
        }
      })
    );

    console.log(`✅ Retrieved ${chatHistory.length} chat histories for user:`, userId);

    return res.json({
      success: true,
      chatHistory: historyWithPresignedUrls
    });
  } catch (error) {
    console.error('❌ Error fetching user chat history:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get chat history: ' + error.message 
    });
  }
});

// Get specific chat history by consultation ID
router.get('/user-chat-history/:consultationId', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.userId;
    
    if (req.user.type !== 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only users can access chat history'
      });
    }

    console.log('📖 Fetching specific chat history for user:', userId, 'consultation:', consultationId);

    const [chatHistory] = await pool.execute(`
      SELECT 
        uch.*,
        a.is_online as advocate_is_online,
        a.rating as advocate_rating,
        a.consultation_fee,
        a.full_name as advocate_full_name
      FROM user_chat_history uch
      LEFT JOIN advocates a ON uch.advocate_id = a.id
      WHERE uch.user_id = ? AND uch.consultation_id = ?
    `, [userId, consultationId]);

    if (chatHistory.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat history not found'
      });
    }

    const chat = chatHistory[0];
    
    // Generate pre-signed URL for advocate photo
    const advocatePhotoUrl = chat.advocate_photo_url 
      ? await generatePresignedUrl(chat.advocate_photo_url)
      : null;

    // Safely parse messages JSON
    let parsedMessages = [];
    try {
      parsedMessages = typeof chat.messages === 'string' 
        ? JSON.parse(chat.messages) 
        : (Array.isArray(chat.messages) ? chat.messages : []);
    } catch (parseError) {
      console.error('❌ Error parsing messages JSON:', parseError);
      console.log('Problem value:', chat.messages);
      parsedMessages = [];
    }

    const result = {
      ...chat,
      advocate_photo_url: advocatePhotoUrl,
      messages: parsedMessages
    };

    console.log('✅ Retrieved specific chat history for consultation:', consultationId);

    return res.json({
      success: true,
      chatHistory: result
    });
  } catch (error) {
    console.error('❌ Error fetching specific chat history:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get chat history: ' + error.message 
    });
  }
});

// Delete user chat history
router.delete('/user-chat-history/:consultationId', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.userId;
    
    if (req.user.type !== 'user') {
      return res.status(403).json({
        success: false,
        error: 'Only users can delete their chat history'
      });
    }

    console.log('🗑️ Deleting chat history for user:', userId, 'consultation:', consultationId);

    const [result] = await pool.execute(
      'DELETE FROM user_chat_history WHERE user_id = ? AND consultation_id = ?',
      [userId, consultationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Chat history not found'
      });
    }

    console.log('✅ Chat history deleted for consultation:', consultationId);

    return res.json({
      success: true,
      message: 'Chat history deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting chat history:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to delete chat history: ' + error.message 
    });
  }
});

// Get available advocates with real-time status
router.get('/advocates', authenticateUser, async (req, res) => {
  try {
    const { specialization, language, minRating, maxFee, isOnline } = req.query;
    
    console.log('🔍 Fetching advocates with filters:', { specialization, language, minRating, maxFee, isOnline });
    console.log('🔍 User making request:', { userId: req.user.userId, email: req.user.email });
    
    let query = `
      SELECT 
        id, full_name, specializations, languages, experience,
        consultation_fee, rating, total_consultations, is_online,
        profile_photo_url, bio, city, state, last_seen, created_at
      FROM advocates 
      WHERE status = ?
    `;
    
    const params = ['approved'];

    if (specialization) {
      query += ` AND JSON_CONTAINS(specializations, ?)`;
      params.push(`"${specialization}"`);
    }

    if (language) {
      query += ` AND JSON_CONTAINS(languages, ?)`;
      params.push(`"${language}"`);
    }

    if (minRating) {
      query += ` AND rating >= ?`;
      params.push(parseFloat(minRating));
    }

    if (maxFee) {
      query += ` AND consultation_fee <= ?`;
      params.push(parseFloat(maxFee));
    }

    if (isOnline === 'true') {
      query += ` AND is_online = true`;
    }

    query += ` ORDER BY is_online DESC, rating DESC, total_consultations DESC`;

    console.log('📝 Executing query:', query);
    console.log('📝 With params:', params);

    const [advocates] = await pool.execute(query, params);

    console.log(`✅ Found ${advocates.length} advocates`);

    // Safely parse JSON fields for each advocate with better error handling + Pre-signed URLs
    const formattedAdvocates = await Promise.all(advocates.map(async (advocate) => {
      try {
        // Generate pre-signed URL for profile photo
        const profilePhotoUrl = advocate.profile_photo_url 
          ? await generatePresignedUrl(advocate.profile_photo_url)
          : null;

        return {
          ...advocate,
          specializations: safeJsonParse(advocate.specializations, []),
          languages: safeJsonParse(advocate.languages, []),
          profile_photo_url: profilePhotoUrl,
          rating: advocate.rating ? parseFloat(advocate.rating) : 0,
          consultation_fee: advocate.consultation_fee ? parseFloat(advocate.consultation_fee) : 0,
          total_consultations: advocate.total_consultations ? parseInt(advocate.total_consultations) : 0,
          experience: advocate.experience ? parseInt(advocate.experience) : 0
        };
      } catch (error) {
        console.error('❌ Error formatting advocate:', advocate.id, error);
        return {
          ...advocate,
          specializations: [],
          languages: [],
          profile_photo_url: null,
          rating: 0,
          consultation_fee: 0,
          total_consultations: 0,
          experience: 0
        };
      }
    }));

    return res.json({
      success: true,
      advocates: formattedAdvocates
    });
  } catch (error) {
    console.error('❌ Error fetching advocates:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get advocates: ' + error.message 
    });
  }
});

// Get advocate details with complete information
router.get('/advocates/:advocateId', authenticateUser, async (req, res) => {
  try {
    const { advocateId } = req.params;

    const [advocates] = await pool.execute(`
      SELECT 
        id, full_name, email, phone, bar_council_number, experience,
        specializations, languages, education, courts_practicing,
        consultation_fee, rating, total_consultations, total_reviews,
        is_online, profile_photo_url, document_urls, bio, city, state, 
        last_seen, created_at
      FROM advocates 
      WHERE id = ? AND status = ?
    `, [advocateId, 'approved']);

    if (advocates.length === 0) {
      return res.status(404).json({ success: false, error: 'Advocate not found' });
    }

    const advocate = advocates[0];

    // Get recent reviews with proper column aliasing to avoid ambiguity
    const [reviews] = await pool.execute(`
      SELECT 
        ar.rating, 
        ar.review_text, 
        ar.created_at as review_date,
        u.name as user_name
      FROM advocate_reviews ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.advocate_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 5
    `, [advocateId]);

    // Generate pre-signed URLs for profile photo and documents
    const profilePhotoUrl = advocate.profile_photo_url 
      ? await generatePresignedUrl(advocate.profile_photo_url)
      : null;

    const documentUrls = safeJsonParse(advocate.document_urls, []);
    const presignedDocumentUrls = await Promise.all(
      documentUrls.map(async (docUrl) => await generatePresignedUrl(docUrl))
    );

    return res.json({
      success: true,
      advocate: {
        ...advocate,
        specializations: safeJsonParse(advocate.specializations, []),
        languages: safeJsonParse(advocate.languages, []),
        courts_practicing: safeJsonParse(advocate.courts_practicing, []),
        document_urls: presignedDocumentUrls,
        profile_photo_url: profilePhotoUrl,
        reviews
      }
    });
  } catch (error) {
    console.error('Get advocate details error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get advocate details: ' + error.message 
    });
  }
});

// Start consultation with real-time notification
router.post('/consultations/start', authenticateUser, async (req, res) => {
  try {
    const { advocateId, consultationType = 'chat' } = req.body;
    const userId = req.user.userId;

    console.log('🚀 Starting consultation:', { advocateId, userId, consultationType });

    if (!advocateId) {
      return res.status(400).json({
        success: false,
        error: 'Advocate ID is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    // Check if advocate is available
    const [advocates] = await pool.execute(
      'SELECT * FROM advocates WHERE id = ? AND status = ?',
      [advocateId, 'approved']
    );

    if (advocates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Advocate is not available or not found'
      });
    }

    const advocate = advocates[0];

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User not found'
      });
    }

    // Create consultation session
    const [result] = await pool.execute(`
      INSERT INTO consultations (
        user_id, advocate_id, consultation_type, fee_amount, status
      ) VALUES (?, ?, ?, ?, 'active')
    `, [userId, advocateId, consultationType, advocate.consultation_fee]);

    const consultationId = result.insertId;

    // Create initial chat room
    await pool.execute(`
      INSERT INTO chat_rooms (
        consultation_id, user_id, advocate_id, status
      ) VALUES (?, ?, ?, 'active')
    `, [consultationId, userId, advocateId]);

    console.log('✅ Consultation created with ID:', consultationId);

    // Emit real-time notification to advocate
    const io = req.app.get('io');
    if (io) {
      io.to(`advocate-${advocateId}`).emit('new-consultation', {
        consultationId,
        userId,
        userName: req.user.name,
        userEmail: req.user.email,
        consultationType,
        feeAmount: advocate.consultation_fee,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      consultation: {
        id: consultationId,
        advocateId,
        advocateName: advocate.full_name,
        consultationType,
        feeAmount: advocate.consultation_fee,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to start consultation: ' + error.message 
    });
  }
});

// Send message with real-time delivery and chat history saving
router.post('/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId, message, messageType = 'text' } = req.body;
    const senderId = req.user.userId || req.user.advocateId;
    const senderType = req.user.type || 'user';

    console.log('📤 Processing message send:', { consultationId, senderId, senderType, messageLength: message?.length });

    if (!consultationId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Consultation ID and message are required'
      });
    }

    // Verify consultation exists and user has access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?) AND status = 'active'
    `, [consultationId, senderId, senderId]);

    if (consultations.length === 0) {
      console.error('❌ Consultation access denied:', { consultationId, senderId });
      return res.status(403).json({
        success: false,
        error: 'Access denied or consultation not found'
      });
    }

    console.log('✅ Consultation access verified');

    // Insert message
    const [result] = await pool.execute(`
      INSERT INTO chat_messages (
        consultation_id, sender_id, sender_type, message, message_type
      ) VALUES (?, ?, ?, ?, ?)
    `, [consultationId, senderId, senderType, message, messageType]);

    console.log('✅ Message inserted with ID:', result.insertId);

    // Update chat room last message
    await pool.execute(`
      UPDATE chat_rooms 
      SET last_message = ?, last_message_time = CURRENT_TIMESTAMP
      WHERE consultation_id = ?
    `, [message, consultationId]);

    console.log('✅ Chat room updated');

    // Save/update user chat history if this is a user's message or advocate's reply
    const consultation = consultations[0];
    
    // Get all messages for this consultation to save complete history
    const [allMessages] = await pool.execute(`
      SELECT * FROM chat_messages 
      WHERE consultation_id = ?
      ORDER BY created_at ASC
    `, [consultationId]);

    // Get advocate details for history
    const [advocateDetails] = await pool.execute(
      'SELECT full_name, profile_photo_url FROM advocates WHERE id = ?',
      [consultation.advocate_id]
    );

    if (advocateDetails.length > 0) {
      const advocate = advocateDetails[0];
      await saveUserChatHistory(
        consultation.user_id,
        consultationId,
        consultation.advocate_id,
        advocate.full_name,
        advocate.profile_photo_url,
        allMessages
      );
    }

    // Emit real-time message to other party
    const io = req.app.get('io');
    if (io) {
      const targetId = senderType === 'user' ? consultation.advocate_id : consultation.user_id;
      const targetType = senderType === 'user' ? 'advocate' : 'user';
      
      io.to(`${targetType}-${targetId}`).emit('new-message', {
        id: result.insertId,
        consultationId,
        senderId,
        senderType,
        message,
        messageType,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: {
        id: result.insertId,
        consultationId,
        senderId,
        senderType,
        message,
        messageType,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('❌ Send message error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send message: ' + error.message 
    });
  }
});

// Get messages for consultation with proper parameter handling
router.get('/consultations/:consultationId/messages', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const userId = req.user.userId || req.user.advocateId;

    console.log('📨 Fetching messages for consultation:', { consultationId, userId, page, limit });

    // Ensure parameters are properly converted to integers and validated
    let pageNum = parseInt(String(page), 10);
    let limitNum = parseInt(String(limit), 10);
    
    // Validate and set safe defaults
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 50;
    if (limitNum > 100) limitNum = 100; // Cap at 100 for performance
    
    const offset = (pageNum - 1) * limitNum;

    console.log('📊 Query parameters:', { pageNum, limitNum, offset });

    // Verify access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?)
    `, [consultationId, userId, userId]);

    if (consultations.length === 0) {
      console.error('❌ Access denied to consultation:', consultationId);
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    console.log('✅ Consultation access verified');

    // Use proper integer parameters for LIMIT and OFFSET
    const [messages] = await pool.execute(`
      SELECT * FROM chat_messages 
      WHERE consultation_id = ?
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `, [consultationId]);

    console.log(`✅ Retrieved ${messages.length} messages`);

    return res.json({
      success: true,
      messages: messages.reverse() // Show oldest first
    });
  } catch (error) {
    console.error('❌ Get messages error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get messages: ' + error.message 
    });
  }
});

// Get user's consultations
router.get('/consultations', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.advocateId;
    const userType = req.user.type || 'user';

    let query, params;

    if (userType === 'advocate') {
      query = `
        SELECT 
          c.*, u.name as user_name, u.email as user_email,
          cr.id as chat_room_id, cr.last_message, cr.last_message_time
        FROM consultations c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN chat_rooms cr ON c.id = cr.consultation_id
        WHERE c.advocate_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          c.*, a.full_name as advocate_name, a.profile_photo_url,
          cr.id as chat_room_id, cr.last_message, cr.last_message_time
        FROM consultations c
        JOIN advocates a ON c.advocate_id = a.id
        LEFT JOIN chat_rooms cr ON c.id = cr.consultation_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
      `;
      params = [userId];
    }

    const [consultations] = await pool.execute(query, params);

    // Generate pre-signed URLs for advocate profile photos in consultations
    const consultationsWithPresignedUrls = await Promise.all(
      consultations.map(async (consultation) => {
        if (consultation.profile_photo_url) {
          consultation.profile_photo_url = await generatePresignedUrl(consultation.profile_photo_url);
        }
        return consultation;
      })
    );

    return res.json({
      success: true,
      consultations: consultationsWithPresignedUrls
    });
  } catch (error) {
    console.error('Get consultations error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get consultations: ' + error.message 
    });
  }
});

// Update advocate online status
router.patch('/advocates/status', authenticateUser, async (req, res) => {
  try {
    const { isOnline } = req.body;
    const advocateId = req.user.advocateId;

    if (req.user.type !== 'advocate') {
      return res.status(403).json({
        success: false,
        error: 'Only advocates can update their status'
      });
    }

    await pool.execute(
      'UPDATE advocates SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
      [isOnline, advocateId]
    );

    // Emit real-time status update
    const io = req.app.get('io');
    if (io) {
      io.emit('advocate-status-update', {
        advocateId,
        isOnline,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Update advocate status error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update status: ' + error.message 
    });
  }
});

// End consultation
router.patch('/consultations/:consultationId/end', authenticateUser, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const userId = req.user.userId || req.user.advocateId;

    // Verify access
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND (user_id = ? OR advocate_id = ?) AND status = 'active'
    `, [consultationId, userId, userId]);

    if (consultations.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Access denied or consultation not found'
      });
    }

    const consultation = consultations[0];

    // End consultation
    await pool.execute(`
      UPDATE consultations 
      SET status = 'completed', ended_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [consultationId]);

    // Update chat room status
    await pool.execute(`
      UPDATE chat_rooms 
      SET status = 'closed'
      WHERE consultation_id = ?
    `, [consultationId]);

    // Update user chat history with final status
    const [allMessages] = await pool.execute(`
      SELECT * FROM chat_messages 
      WHERE consultation_id = ?
      ORDER BY created_at ASC
    `, [consultationId]);

    const [advocateDetails] = await pool.execute(
      'SELECT full_name, profile_photo_url FROM advocates WHERE id = ?',
      [consultation.advocate_id]
    );

    if (advocateDetails.length > 0) {
      const advocate = advocateDetails[0];
      await saveUserChatHistory(
        consultation.user_id,
        consultationId,
        consultation.advocate_id,
        advocate.full_name,
        advocate.profile_photo_url,
        allMessages
      );
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      const targetId = req.user.type === 'user' ? consultation.advocate_id : consultation.user_id;
      const targetType = req.user.type === 'user' ? 'advocate' : 'user';
      
      io.to(`${targetType}-${targetId}`).emit('consultation-ended', {
        consultationId,
        endedBy: req.user.type,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Consultation ended successfully'
    });
  } catch (error) {
    console.error('End consultation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to end consultation: ' + error.message 
    });
  }
});

// Submit review
router.post('/reviews', authenticateUser, async (req, res) => {
  try {
    const { consultationId, advocateId, rating, reviewText } = req.body;
    const userId = req.user.userId;

    if (req.user.type === 'advocate') {
      return res.status(403).json({
        success: false,
        error: 'Advocates cannot submit reviews'
      });
    }

    if (!consultationId || !advocateId || !rating) {
      return res.status(400).json({
        success: false,
        error: 'Consultation ID, advocate ID, and rating are required'
      });
    }

    // Verify consultation exists and is completed
    const [consultations] = await pool.execute(`
      SELECT * FROM consultations 
      WHERE id = ? AND user_id = ? AND advocate_id = ? AND status = 'completed'
    `, [consultationId, userId, advocateId]);

    if (consultations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consultation or consultation not completed'
      });
    }

    // Check if review already exists
    const [existingReviews] = await pool.execute(`
      SELECT id FROM advocate_reviews 
      WHERE consultation_id = ? AND user_id = ?
    `, [consultationId, userId]);

    if (existingReviews.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Review already submitted for this consultation'
      });
    }

    // Insert review
    await pool.execute(`
      INSERT INTO advocate_reviews (
        consultation_id, user_id, advocate_id, rating, review_text
      ) VALUES (?, ?, ?, ?, ?)
    `, [consultationId, userId, advocateId, rating, reviewText || '']);

    // Update advocate's average rating
    const [ratingStats] = await pool.execute(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
      FROM advocate_reviews 
      WHERE advocate_id = ?
    `, [advocateId]);

    await pool.execute(`
      UPDATE advocates 
      SET rating = ?, total_reviews = ?
      WHERE id = ?
    `, [ratingStats[0].avg_rating, ratingStats[0].total_reviews, advocateId]);

    return res.json({
      success: true,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to submit review: ' + error.message 
    });
  }
});

module.exports = router;