// server/src/routes/documents.js
const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { uploadS3, uploadLocal } = require('../config/multer-s3');
const { s3 } = require('../config/s3');
const axios = require('axios');

const router = express.Router();

// Upload document to S3 and analyze
router.post('/upload', authenticateToken, (req, res) => {
  // Use S3 upload with fallback to local
  const uploadMiddleware = process.env.AWS_ACCESS_KEY_ID ? uploadS3 : uploadLocal;
  
  uploadMiddleware.single('document')(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload failed'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    let documentId = null;

    try {
      const { language = 'en', documentType = 'legal' } = req.body;
      const userId = req.user.id;
      const fileSize = req.file.size;

      // Check storage quota
      if (req.user.storage_used + fileSize > req.user.max_storage) {
        // Delete uploaded file if quota exceeded
        if (req.file.key) {
          await s3.deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: req.file.key
          }).promise();
        }
        
        return res.status(413).json({
          success: false,
          error: 'Storage quota exceeded'
        });
      }

      // Store document metadata
      const [result] = await pool.execute(`
        INSERT INTO documents (
          user_id, original_name, file_name, s3_key, s3_url, 
          file_size, mime_type, document_type, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'analyzing')
      `, [
        userId,
        req.file.originalname,
        req.file.filename || req.file.key,
        req.file.key || req.file.path,
        req.file.location || req.file.path,
        fileSize,
        req.file.mimetype,
        documentType
      ]);

      documentId = result.insertId;

      // Update user storage
      await pool.execute(
        'UPDATE users SET storage_used = storage_used + ? WHERE id = ?',
        [fileSize, userId]
      );

      // Add to processing queue
      await pool.execute(
        'INSERT INTO processing_queue (document_id, status) VALUES (?, "pending")',
        [documentId]
      );

      // Start analysis process
      processDocumentAnalysis(documentId, req.file, language);

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        document: {
          id: documentId,
          originalName: req.file.originalname,
          status: 'analyzing',
          fileSize: fileSize,
          uploadDate: new Date()
        }
      });

    } catch (error) {
      console.error('Document processing error:', error);

      // Cleanup on error
      if (documentId) {
        await pool.execute(
          'UPDATE documents SET status = "error" WHERE id = ?',
          [documentId]
        );
      }

      if (req.file.key) {
        try {
          await s3.deleteObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: req.file.key
          }).promise();
        } catch (deleteError) {
          console.error('Error deleting file from S3:', deleteError);
        }
      }

      res.status(500).json({
        success: false,
        error: 'Document processing failed'
      });
    }
  });
});

// Get user's documents
router.get('/my-documents', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, documentType } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE d.user_id = ?';
    let queryParams = [userId];

    if (status) {
      whereClause += ' AND d.status = ?';
      queryParams.push(status);
    }

    if (documentType) {
      whereClause += ' AND d.document_type = ?';
      queryParams.push(documentType);
    }

    if (search) {
      whereClause += ' AND (d.original_name LIKE ? OR d.extracted_text LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [documents] = await pool.execute(`
      SELECT 
        d.id,
        d.original_name,
        d.file_size,
        d.mime_type,
        d.document_type,
        d.status,
        d.upload_date,
        d.analysis_date,
        d.access_count,
        d.tags,
        da.summary,
        da.clauses,
        da.risks,
        da.suggestions
      FROM documents d
      LEFT JOIN document_analysis da ON d.id = da.document_id
      ${whereClause}
      ORDER BY d.upload_date DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM documents d
      ${whereClause}
    `, queryParams);

    res.json({
      success: true,
      documents: documents.map(doc => ({
        ...doc,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        clauses: doc.clauses ? JSON.parse(doc.clauses) : [],
        risks: doc.risks ? JSON.parse(doc.risks) : [],
        suggestions: doc.suggestions ? JSON.parse(doc.suggestions) : []
      })),
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve documents'
    });
  }
});

// Get specific document
router.get('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const [documents] = await pool.execute(`
      SELECT 
        d.*,
        da.summary,
        da.clauses,
        da.risks,
        da.suggestions,
        da.page_metadata,
        da.key_value_pairs,
        da.entities
      FROM documents d
      LEFT JOIN document_analysis da ON d.id = da.document_id
      WHERE d.id = ? AND d.user_id = ?
    `, [documentId, userId]);

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = documents[0];

    // Increment access count
    await pool.execute(
      'UPDATE documents SET access_count = access_count + 1 WHERE id = ?',
      [documentId]
    );

    res.json({
      success: true,
      document: {
        ...document,
        clauses: document.clauses ? JSON.parse(document.clauses) : [],
        risks: document.risks ? JSON.parse(document.risks) : [],
        suggestions: document.suggestions ? JSON.parse(document.suggestions) : [],
        pageMetadata: document.page_metadata ? JSON.parse(document.page_metadata) : {},
        keyValuePairs: document.key_value_pairs ? JSON.parse(document.key_value_pairs) : [],
        entities: document.entities ? JSON.parse(document.entities) : {}
      }
    });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve document'
    });
  }
});

// Download document
router.get('/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const [documents] = await pool.execute(
      'SELECT s3_key, original_name, mime_type FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = documents[0];

    // Generate signed URL for download
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: document.s3_key,
      Expires: 3600, // 1 hour
      ResponseContentDisposition: `attachment; filename="${document.original_name}"`
    });

    res.json({
      success: true,
      downloadUrl,
      fileName: document.original_name,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate download link'
    });
  }
});

// Delete document
router.delete('/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    // Get document info
    const [documents] = await pool.execute(
      'SELECT s3_key, file_size FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    );

    if (documents.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const document = documents[0];

    // Delete from S3
    if (document.s3_key) {
      try {
        await s3.deleteObject({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: document.s3_key
        }).promise();
      } catch (s3Error) {
        console.warn('S3 deletion failed:', s3Error.message);
      }
    }

    // Delete from database
    await pool.execute(
      'DELETE FROM documents WHERE id = ? AND user_id = ?',
      [documentId, userId]
    );

    // Update user storage
    await pool.execute(
      'UPDATE users SET storage_used = storage_used - ? WHERE id = ?',
      [document.file_size, userId]
    );

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

// Document analysis function (integrates with your existing analyze.js)
async function processDocumentAnalysis(documentId, file, language) {
  try {
    // Update processing queue
    await pool.execute(
      'UPDATE processing_queue SET status = "processing", started_at = CURRENT_TIMESTAMP WHERE document_id = ?',
      [documentId]
    );

    let text = '';
    let pages = 1;

    // Download file from S3 for processing
    let fileBuffer;
    if (file.key) {
      const s3Object = await s3.getObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: file.key
      }).promise();
      fileBuffer = s3Object.Body;
    } else {
      fileBuffer = require('fs').readFileSync(file.path);
    }

    // Process based on file type (from your analyze.js)
    if (file.mimetype === 'application/pdf') {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fileBuffer);
      text = data.text.trim();
      pages = data.numpages || 1;

      if (text.length < 100) {
        // Use OCR as fallback
        const Tesseract = require('tesseract.js');
        const result = await Tesseract.recognize(fileBuffer, 'eng');
        text = result.data.text;
      }
    } else if (file.mimetype.includes('wordprocessingml.document')) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value.trim();
    } else if (file.mimetype.startsWith('image/')) {
      const Tesseract = require('tesseract.js');
      const result = await Tesseract.recognize(fileBuffer, 'eng');
      text = result.data.text;
    }

    // Call Gemini API for analysis (from your analyze.js)
    const analysisResult = await callGeminiForAnalysis(text);

    // Store analysis results
    await pool.execute(`
      INSERT INTO document_analysis (
        document_id, summary, clauses, risks, suggestions, 
        page_metadata, key_value_pairs, entities, processing_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      documentId,
      analysisResult.summary,
      JSON.stringify(analysisResult.clauses || []),
      JSON.stringify(analysisResult.risks || []),
      JSON.stringify(analysisResult.suggestions || []),
      JSON.stringify(analysisResult.pageMetadata || {}),
      JSON.stringify({}), // key_value_pairs
      JSON.stringify({}), // entities
      Date.now() - Date.now() // processing_time_ms
    ]);

    // Update document status
    await pool.execute(`
      UPDATE documents 
      SET status = 'completed', extracted_text = ?, analysis_date = CURRENT_TIMESTAMP, tags = ?
      WHERE id = ?
    `, [
      text,
      JSON.stringify(analysisResult.tags || []),
      documentId
    ]);

    // Update processing queue
    await pool.execute(
      'UPDATE processing_queue SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE document_id = ?',
      [documentId]
    );

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Update status to error
    await pool.execute(
      'UPDATE documents SET status = "error" WHERE id = ?',
      [documentId]
    );

    await pool.execute(
      'UPDATE processing_queue SET status = "failed", error_message = ?, completed_at = CURRENT_TIMESTAMP WHERE document_id = ?',
      [error.message, documentId]
    );
  }
}

// Gemini API function (from your analyze.js)
async function callGeminiForAnalysis(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: `You are an expert legal assistant. Analyze this legal document and return a detailed analysis in JSON format:

{
  "summary": "Brief summary of the document",
  "clauses": ["List of important clauses"],
  "risks": ["List of potential risks"],
  "suggestions": ["List of suggestions"],
  "tags": ["List of relevant tags"],
  "pageMetadata": {
    "1": "Page 1 content summary"
  }
}

Document text:
${text.slice(0, 10000)}`
        }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/``````/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      summary: 'Analysis completed but detailed insights unavailable.',
      clauses: [],
      risks: [],
      suggestions: [],
      tags: [],
      pageMetadata: {}
    };
  }
}

module.exports = router;
