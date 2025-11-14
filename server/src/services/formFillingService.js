const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const fontkit = require('fontkit');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { s3 } = require('../config/s3'); 
const { v4: uuidv4 } = require('uuid');
const { Upload } = require('@aws-sdk/lib-storage');

//More languages:
const FONT_MAP = [
  { name: 'NotoSansDevanagari', path: 'NotoSansDevanagari-Regular.ttf', test: /[\u0900-\u097F]/ }, // Hindi
  { name: 'NotoSansBengali', path: 'NotoSansBengali-Regular.ttf', test: /[\u0980-\u09FF]/ }, // Bengali
  { name: 'NotoSansTamil', path: 'NotoSansTamil-Regular.ttf', test: /[\u0B80-\u0BFF]/ }, // Tamil
  { name: 'NotoSansTelugu', path: 'NotoSansTelugu-Regular.ttf', test: /[\u0C00-\u0C7F]/ }, // Telugu
  { name: 'NotoSansGujarati', path: 'NotoSansGujarati-Regular.ttf', test: /[\u0A80-\u0AFF]/ }, // Gujarati
  { name: 'NotoSansGurmukhi', path: 'NotoSansGurmukhi-Regular.ttf', test: /[\u0A00-\u0A7F]/ }, // Punjabi
  { name: 'NotoSansKannada', path: 'NotoSansKannada-Regular.ttf', test: /[\u0C80-\u0CFF]/ }, // Kannada
  { name: 'NotoSansMalayalam', path: 'NotoSansMalayalam-Regular.ttf', test: /[\u0D00-\u0D7F]/ }, // Malayalam
  { name: 'NotoSansOriya', path: 'NotoSansOriya-Regular.ttf', test: /[\u0B00-\u0B7F]/ }, // Oriya
  { name: 'NotoNastaliqUrdu', path: 'NotoNastaliqUrdu-Regular.ttf', test: /[\u0600-\u06FF]/ }, // Urdu (the font displayed is not that good for urdu)
  { name: 'NotoSans', path: 'NotoSans-Regular.ttf', test: /[\u0000-\u007F]/ }, // Default Latin
];

async function loadFonts(pdfDoc) {
  const loadedFonts = {};
  for (const fontSpec of FONT_MAP) {
    try {
      const fontPath = path.join(__dirname, '..', 'fonts', fontSpec.path);
      const fontBuffer = await fsp.readFile(fontPath);
      loadedFonts[fontSpec.name] = await pdfDoc.embedFont(fontBuffer, { subset: false });

      console.log('Fonts in directory:', fs.readdirSync(fontDir));

    } catch (e) {
      console.warn(`⚠️ Font ${fontSpec.name} could not be loaded.`);
    }
  }
  // Always load a default font
  // loadedFonts['Default'] = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return loadedFonts;
}

function pickFontForText(loadedFonts, text) {
  for (const fontSpec of FONT_MAP) {
    if (fontSpec.test.test(text) && loadedFonts[fontSpec.name]) {
      return loadedFonts[fontSpec.name];
    }
  }
// return loadedFonts['Default'];
return null;
}

class FormFillingService {
  async fillForm(filePath, formData, formFields = [], imageHeight = null) {
    try {
      const fileBuffer = await fsp.readFile(filePath);
      const pdfDoc = await PDFDocument.load(fileBuffer);
      pdfDoc.registerFontkit(fontkit);

      // Load fonts
      // const defaultFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      // const devFontPath = path.join(__dirname, '..', 'fonts', 'NotoSansDevanagari-Regular.ttf');
      //For more languages
      const loadedFonts = await loadFonts(pdfDoc);

      // let unicodeFont = null;
      // try {
      //   const fontBuffer = await fsp.readFile(devFontPath);
      //   unicodeFont = await pdfDoc.embedFont(fontBuffer, { subset: false });
      // } catch (err) {
      //   console.warn('⚠️ Hindi font not found. Only default font will be used.');
      // }

      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height: pageHeight } = firstPage.getSize();

      for (const [fieldId, valueRaw] of Object.entries(formData)) {
        const value = String(valueRaw || '').trim();
        if (!value) continue;

        const field = formFields.find(f => f.id === fieldId);

        if (!field || !Array.isArray(field.rect) || field.rect.length !== 4) {
          console.warn(`⚠️ Skipping "${fieldId}": invalid or missing rectangle info.`);
          continue;
        }

        let [x, y, x2, y2] = field.rect;
        // if (imageHeight) {
        //   y = pageHeight - y;
        //   y2 = pageHeight - y2;
        //   if (y2 < y) [y, y2] = [y2, y];
        // }

        const fieldWidth = Math.abs(x2 - x);
        const fieldHeight = Math.abs(y2 - y);

        // Determine which font to use
        // const isHindi = /[\u0900-\u097F]/.test(value);
        // let font = defaultFont;
        //more language:
        const font = pickFontForText(loadedFonts, value);

        // if (isHindi) {
        //   if (!unicodeFont) {
        //     console.warn(`⚠️ Hindi text detected in "${fieldId}" but Devanagari font not loaded.`);
        //   } else {
        //     font = unicodeFont;
        //   }
        // }

        if (!font) {
          console.error(`❌ No font available for field "${fieldId}". Skipping.`);
          continue;
        }

        let fontSize = Math.min(fieldHeight * 0.8, 14);
        let textWidth = font.widthOfTextAtSize(value, fontSize);
        while (textWidth > fieldWidth - 4 && fontSize > 6) {
          fontSize -= 0.5;
          textWidth = font.widthOfTextAtSize(value, fontSize);
        }

        const textX = x + (fieldWidth - textWidth) / 2;
        const textHeight = font.heightAtSize(fontSize);
        // const textY = y - (fieldHeight / 2) - (textHeight / 2) + (fontSize * 2.9);
        const textY = pageHeight-y-7.5;
        
        console.log("debug: final text location",textX, textY);
        

        // Highlight box 
        firstPage.drawRectangle({
          x: textX,
          y: textY,
          width: textWidth,
          height: textHeight, 
          color: rgb(1, 1, 0.4), // yellow
          opacity: 1
        });

        // Draw text
        firstPage.drawText(value, {
          x: textX, 
          y: textY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0)
        });
      }

      const pdfBytes = await pdfDoc.save();

      // AWS S3 save using AWS SDK v3:
      const fileName = `filled_${uuidv4()}.pdf`;
      const s3Key = `filled-forms/${fileName}`;

      console.log('📤 Uploading filled form to S3...');

      try {
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: s3Key,
            Body: pdfBytes,
            ContentType: 'application/pdf',
            ACL: 'private'
          }
        });

        const uploadResult = await upload.done();
        console.log('✅ S3 upload successful:', uploadResult.Location);

        // Generate a pre-signed URL for download using AWS SDK v3
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const { GetObjectCommand } = require('@aws-sdk/client-s3');

        const downloadUrl = await getSignedUrl(s3, new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          ResponseContentDisposition: `attachment; filename="${fileName}"`
        }), { expiresIn: 3600 }); // 1 hour

        return {
          filePath: uploadResult.Location,
          downloadUrl: downloadUrl,
          s3Key: s3Key,
          fileName: fileName
        };
      } catch (s3Error) {
        console.error('❌ S3 upload failed:', s3Error);
        throw new Error('Failed to upload filled form to S3: ' + s3Error.message);
      }
    } catch (error) {
      console.error('Form filling error:', error);
      throw new Error('Failed to fill form: ' + error.message);
    }
  }
}

module.exports = new FormFillingService();