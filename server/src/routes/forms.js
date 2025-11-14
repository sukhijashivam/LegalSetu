// server/src/routes/forms.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aiVisionService = require('../services/aiVisionService');
const formFillingService = require('../services/formFillingService');
const { s3 } = require('../config/s3');

const router = express.Router();

// Ensure upload directories exist
const uploadDirs = ['uploads/forms', 'uploads/filled', 'uploads/audio'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/forms/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
  }
});

// Upload form and detect fields using AI
router.post('/upload', upload.single('form'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const targetLanguage = req.body.language || 'en';
    const { formFields, imageHeight, imageWidth } = await aiVisionService.detectFormFields(req.file.path, targetLanguage);
    
    res.json({
      success: true,
      formId: path.basename(req.file.path),
      formFields,
      imageHeight,
      imageWidth,
      originalName: req.file.originalname
    });


  } catch (error) {
    res.status(500).json({ success: false, error: 'Form processing failed: ' + error.message });
  }
});


// Fill form endpoint
router.post('/fill', async (req, res) => {
  try {
    console.log('Fill request received:', {
      formId: req.body.formId,
      formDataKeys: Object.keys(req.body.formData || {}),
      fieldCount: req.body.formFields?.length || 0,
      imageHeight: req.body.imageHeight // Log this to verify it's being passed
    });
    
    const { formId, formData, formFields, imageHeight } = req.body;
    
    if (!formId || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Form ID and form data are required'
      });
    }
    
    const formPath = path.join('uploads', 'forms', formId);
    const result = await formFillingService.fillForm(formPath, formData, formFields || [], imageHeight);
    
    res.json({ success: true, downloadUrl: result.downloadUrl });
  } catch (error) {
    console.error('Form filling error:', error);
    res.status(500).json({
      success: false,
      error: 'Form filling failed: ' + error.message
    });
  }
});



// Download filled form
router.get('/download/:fileName', (req, res) => {
  // try {
  //   const filePath = path.join('uploads', 'filled', req.params.fileName);
    
  //   if (fs.existsSync(filePath)) {
  //     res.download(filePath);
  //   } else {
  //     res.status(404).json({
  //       success: false,
  //       error: 'File not found'
  //     });
  //   }
  // } catch (error) {
  //   console.error('Download error:', error);
  //   res.status(500).json({
  //     success: false,
  //     error: 'Download failed'
  //   });
  // }

  // AWS Version:
    try {
    const { fileName } = req.params;
    const s3Key = `filled-forms/${fileName}`;

    // Generate a new signed URL (in case the previous one expired)
    const downloadUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Expires: 3600,
      ResponseContentDisposition: `attachment; filename="${fileName}"`
    });

    // Redirect to the signed URL
    res.redirect(downloadUrl);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Download failed'
    });
  }

});

module.exports = router;
