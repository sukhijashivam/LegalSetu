// server/src/services/speechRecognitionService.js
const axios = require('axios');
const fs = require('fs').promises;

class SpeechRecognitionService {
  async recognizeSpeech(audioBuffer, language) {
    try {
      // Map short language codes to BCP-47 format
      const languageMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'bn': 'bn-IN',
        'te': 'te-IN',
        'ta': 'ta-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'or': 'or-IN',
        'pa': 'pa-IN',
        'as': 'as-IN',
        'ne': 'ne-NP',
        'ur': 'ur-IN'
      };
      
      const langCode = languageMap[language] || 'en-IN';
      
      // Using Google Cloud Speech-to-Text API
      const response = await axios.post(
        `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_API_KEY}`,
        {
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: langCode,
          },
          audio: {
            content: audioBuffer.toString('base64')
          }
        }
      );

      const transcription = response.data.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      return { transcription };
    } catch (error) {
      console.error('Speech recognition error:', error);
      throw new Error('Failed to recognize speech');
    }
  }
}

module.exports = new SpeechRecognitionService();
