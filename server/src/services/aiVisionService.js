// server/src/services/aiVisionService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const { convertPdfToImage } = require('../utils/pdfToImage');
const fs = require('fs');

class AIVisionService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async detectFormFields(filePath, targetLanguage = 'en') {
    try {
      // Convert PDF to PNG image and get dimensions
      const { outputPath, height: imageHeight, width: imageWidth } = await convertPdfToImage(filePath);
      const imageBuffer = fs.readFileSync(outputPath);
      const imageData = this.fileToGenerativePart(imageBuffer, "image/png");


      const prompt = `
        You are an expert at analyzing any form image and generating user-friendly, conversational questions for each field. Your task is to:

1. Detect and identify **all form fields** (text fields, checkboxes, radio buttons, dropdowns, signature lines, etc.) present in the attached form image, regardless of the form's type or domain.
2. For each field, extract:
    - label: Rewrite the field's label or prompt as a clear, direct question you would ask a user to fill in the field. Use natural, conversational English (e.g., convert "Name" or "Full Name" to "What is your name?", "Age" to "What is your age?", "College" to "What college do you attend?"). If the label is missing or unclear, infer the most appropriate question based on context.
    - type: Specify the field type (e.g., "text", "checkbox", "radio", "dropdown", "signature", "date", etc.).
    - rect: The bounding box coordinates of the field as [x, y, x2, y2] in pixels.
    - id: Assign a unique identifier to each field (e.g., "field_1", "field_2", ...).

Output Format:  
Return a JSON array in the following structure:
      [
      {
      "id": "field_1",
      "label": "What is your name?",
      "type": "text",
      "rect": [x, y, x2, y2]
      },
      // ...additional fields
      ]


**Instructions:**
- Be exhaustive: identify every field a user is expected to fill or interact with.
- For grouped fields (e.g., multiple checkboxes for a single question), list each one separately with its own label and coordinates.
- Use the actual image dimensions to calculate all positions accurately.
- Only include fields intended for user input.
- Ensure the "label" is always a clear question, suitable for asking a user directly.

**Example:**  
If the form says:  
"My name is ____________________"
Return:
[
{
"id": "field_1",
"label": "What is your name?",
"type": "text",
"rect": [x, y, x2, y2]
}
]

Return only the JSON array as specified above.

      `;

      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      const text = response.text();
      const formFields = this.extractJsonFromResponse(text);
      
      console.log("debug: fields by AI", formFields);
      
      if (targetLanguage !== 'en') {
      const translatedFields = await this.translateFieldLabels(formFields, targetLanguage);
      return { formFields: translatedFields, imageHeight, imageWidth };
    }
    
    return { formFields, imageHeight, imageWidth };
  } catch (error) {
    console.error('AI Vision form field detection error:', error);
    return { formFields: this.getFallbackFields(), imageHeight: 1000, imageWidth: 800 };
  }
}


  fileToGenerativePart(buffer, mimeType) {
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  }

  extractJsonFromResponse(text) {
    try {
      const cleanText = text.replace(/``````/g, '');
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse JSON from AI response:', error);
      return this.getFallbackFields();
    }
  }

  getFallbackFields() {
    return [
      { id: 'field_1', label: 'Name__', type: 'text', rect: [100, 100, 400, 130] },
      { id: 'field_2', label: 'Age', type: 'number', rect: [450, 100, 500, 130] },
      { id: 'field_3', label: 'College', type: 'text', rect: [100, 150, 400, 180] }
    ];
  }


  async translateFieldLabels(formFields, targetLanguage) {
    try {
      const translatedFields = [];
      
      for (const field of formFields) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: field.label,
              targetLang: targetLanguage,
              sourceLang: 'en'
            })
          });
          
          const data = await response.json();
          const translatedLabel = data.translation || field.label;
          
          translatedFields.push({
            ...field,
            originalLabel: field.label,
            label: translatedLabel
          });
        } catch (error) {
          console.warn('Translation failed for field:', field.label);
          translatedFields.push(field);
        }
      }
      
      return translatedFields;
    } catch (error) {
      console.error('Field translation error:', error);
      return formFields;
    }
  }
}

module.exports = new AIVisionService();
