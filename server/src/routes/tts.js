const express = require('express');
const router = express.Router();
const ttsService = require('../services/ttsService');

// POST /api/tts
router.post('/api/tts', async (req, res) => {
  const { text, language } = req.body;

  if (!text || !language) {
    return res.status(400).json({ error: 'Text and language are required.' });
  }

  try {
    const { audioUrl } = await ttsService.textToSpeech(text, language);
    return res.json({ audioUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'TTS failed.' });
  }
});

module.exports = router;
