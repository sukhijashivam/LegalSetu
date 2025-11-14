// server/src/services/ttsService.js
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TTSService {
  constructor() {
  this.supportedLanguages = [
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'gu-IN', name: 'Gujarati' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'or-IN', name: 'Odia' },
    { code: 'pa-IN', name: 'Punjabi' },
    { code: 'as-IN', name: 'Assamese' },
    { code: 'ur-IN', name: 'Urdu' },
    { code: 'ne-NP', name: 'Nepali' },
    { code: 'sd-IN', name: 'Sindhi' },
    { code: 'ks-IN', name: 'Kashmiri' },
    { code: 'sa-IN', name: 'Sanskrit' },
    { code: 'doi-IN', name: 'Dogri' },
    { code: 'mni-IN', name: 'Manipuri' },
    { code: 'kok-IN', name: 'Konkani' },
    { code: 'bho-IN', name: 'Bhojpuri' },
    { code: 'mai-IN', name: 'Maithili' }
  ];
}


  async textToSpeech(text, language) {
    try {
      // Map short language codes to BCP-47 format
      const languageMap = {
  'en': 'en-IN',
  'hi': 'hi-IN',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'bn': 'bn-IN',
  'gu': 'gu-IN',
  'mr': 'mr-IN',
  'or': 'or-IN',
  'pa': 'pa-IN',
  'as': 'as-IN',
  'ur': 'ur-IN',
  'ne': 'ne-NP',
  'sd': 'sd-IN',
  'ks': 'ks-IN',
  'sa': 'sa-IN',
  'doi': 'doi-IN',
  'mni': 'mni-IN',
  'kok': 'kok-IN',
  'bho': 'bho-IN',
  'mai': 'mai-IN'
};

      
      const langCode = languageMap[language] || 'en-IN';
      
      // Using Google Cloud Text-to-Speech API
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_API_KEY}`,
        {
          input: { text },
          voice: { languageCode: langCode, ssmlGender: 'NEUTRAL' },
          audioConfig: { audioEncoding: 'MP3' }
        }
      );

      const audioContent = response.data.audioContent;
      const fileName = `tts_${Date.now()}.mp3`;
      const filePath = path.join('uploads', 'audio', fileName);
      
      // Ensure directory exists
      await fs.mkdir(path.join('uploads', 'audio'), { recursive: true });
      
      // Save audio file
      await fs.writeFile(filePath, Buffer.from(audioContent, 'base64'));
      
      return {
        audioUrl: `/uploads/audio/${fileName}`,
        fileName
      };
    } catch (error) {
      console.error('TTS error:', error);
      throw new Error('Failed to generate speech');
    }
  }
}

module.exports = new TTSService();
