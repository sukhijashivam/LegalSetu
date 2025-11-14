// server/src/services/formFieldService.js
const fs = require('fs').promises;
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

class FormFieldService {
  async detectFormFields(filePath, targetLanguage = 'en') {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (fileExtension === '.pdf') {
        // Convert PDF to image first
        const { outputPath, height: imageHeight, width: imageWidth } = await this.convertPdfToImage(filePath);
        const formFields = await this.detectFieldsFromImage(outputPath, imageHeight, imageWidth);
        
        if (targetLanguage !== 'en') {
          return { 
            formFields: await this.translateFieldLabels(formFields, targetLanguage), 
            imageHeight, 
            imageWidth 
          };
        }
        
        return { formFields, imageHeight, imageWidth };
      } else if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        const metadata = await sharp(filePath).metadata();
        const formFields = await this.detectFieldsFromImage(filePath, metadata.height, metadata.width);
        return { formFields, imageHeight: metadata.height, imageWidth: metadata.width };
      }
    } catch (error) {
      console.error('Form field detection error:', error);
      throw error;
    }
  }

  async detectFieldsFromImage(imagePath, imageHeight, imageWidth) {
    try {
      // Use OCR to detect text and positions
      const { data } = await Tesseract.recognize(imagePath, 'eng', {
        logger: m => console.log(m)
      });
      
      // Find underscore sequences and their positions
      const formFields = [];
      let fieldCount = 0;
      
      // Process each line and word to find underscores
      data.lines.forEach((line, lineIndex) => {
        line.words.forEach((word, wordIndex) => {
          // Look for underscore patterns
          if (word.text.match(/_{2,}/)) {
            // Find the label (previous words in the same line)
            let label = '';
            for (let i = wordIndex - 1; i >= 0; i--) {
              const prevWord = line.words[i];
              if (prevWord.text.match(/^(is|are|was|were)$/i)) {
                // Stop at common connecting words
                break;
              }
              label = prevWord.text + ' ' + label;
            }
            
            label = label.trim() || `Field ${fieldCount + 1}`;
            fieldCount++;
            
            // Use the bounding box of the underscore word
            const bbox = word.bbox;
            
            formFields.push({
              id: `field_${fieldCount}`,
              label: this.cleanLabel(label),
              type: this.determineFieldType(label),
              rect: [bbox.x0, bbox.y0, bbox.x1, bbox.y1], // Image coordinates
              value: '',
              required: false,
              page: 0
            });
          }
        });
      });
      
      // If no underscores found, look for colon patterns
      if (formFields.length === 0) {
        formFields.push(...this.detectColonFields(data));
      }
      
      return formFields;
    } catch (error) {
      console.error('OCR detection error:', error);
      return this.getFallbackFields();
    }
  }

  detectColonFields(ocrData) {
    const fields = [];
    let fieldCount = 0;
    
    ocrData.lines.forEach((line) => {
      const lineText = line.words.map(w => w.text).join(' ');
      
      // Look for patterns like "Name:" or "Age:"
      const colonMatch = lineText.match(/^(.+?):\s*$/);
      if (colonMatch) {
        const label = colonMatch[1].trim();
        const lastWord = line.words[line.words.length - 1];
        
        fieldCount++;
        fields.push({
          id: `field_${fieldCount}`,
          label: this.cleanLabel(label),
          type: this.determineFieldType(label),
          rect: [
            lastWord.bbox.x1 + 10, // Start after the colon
            lastWord.bbox.y0,
            lastWord.bbox.x1 + 200, // Assume 200px width
            lastWord.bbox.y1
          ],
          value: '',
          required: false,
          page: 0
        });
      }
    });
    
    return fields;
  }

  cleanLabel(label) {
    return label
      .replace(/^(my|the|a|an)\s+/i, '')
      .replace(/\s+(is|are|was|were)\s*$/i, '')
      .replace(/[\.\:\,]+$/, '')
      .trim();
  }

  determineFieldType(fieldName) {
    const name = fieldName.toLowerCase();
    if (name.includes('email')) return 'email';
    if (name.includes('phone') || name.includes('mobile')) return 'tel';
    if (name.includes('date') || name.includes('birth')) return 'date';
    if (name.includes('age') || name.includes('number')) return 'number';
    return 'text';
  }

  getFallbackFields() {
    return [
      {
        id: 'field_1',
        label: 'Name',
        type: 'text',
        rect: [150, 400, 350, 430], // Approximate positions
        value: '',
        required: true,
        page: 0
      },
      {
        id: 'field_2',
        label: 'Age',
        type: 'number',
        rect: [400, 400, 450, 430],
        value: '',
        required: false,
        page: 0
      }
    ];
  }

  async convertPdfToImage(pdfPath) {
    const { convertPdfToImage } = require('../utils/pdfToImage');
    return await convertPdfToImage(pdfPath);
  }

  async translateFieldLabels(formFields, targetLanguage) {
    // Implementation for translation
    return formFields;
  }
}

module.exports = new FormFieldService();
