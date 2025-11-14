require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');
const axios = require('axios');
const path = require('path');
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({ key: process.env.GOOGLE_API_KEY });
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// In-memory cache: key = hash(docText + lang), value = analysis result
const analysisCache = new Map();

// Generate a cache key from document content and language
function getCacheKey(text, lang) {
  return crypto.createHash('sha256').update(text + '|LANG|' + lang).digest('hex');
}

// --- Text extraction utilities ---
// const extractTextFromImage = async (filePath) => {
//   const result = await Tesseract.recognize(filePath, 'eng');
//   const text = result.data.text?.trim() || '';

//   if (text.length < 20) {
//     throw new Error('OCR failed or text too short to analyze.');
//   }

//   return text;
// };
const extractTextFromImage = async (filePath) => {
  const result = await Tesseract.recognize(filePath, 'eng');
  const text = result.data.text?.trim() || '';

  if (text.length < 20) {
    throw new Error('OCR failed or text too short to analyze.');
  }

  return text;
};




// const extractTextFromPDF = async (filePath) => {
//   const buffer = fs.readFileSync(filePath);
//   const data = await pdfParse(buffer);
//   const text = data.text.trim();
//   if (text.length < 100) {
//     const imageText = await extractTextFromImage(filePath);
//     return { text: imageText, pages: data.numpages || 1 };
//   }
//   return { text, pages: data.numpages || 1 };
// };
const extractTextFromPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  if (text.length < 100) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: data.numpages || 1 };
  }
  return { text, pages: data.numpages || 1 };
};

const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  const text = result.value.trim();
  if (text.length < 50) {
    const imageText = await extractTextFromImage(filePath);
    return { text: imageText, pages: 1 };
  }
  return { text, pages: 1 };
};
// Add this near the top with other utilities
// const extractTextFromAny = async (filePath, mime, ext) => {
//   if (
//     mime === 'application/pdf' ||
//     ext === '.pdf'
//   ) {
//     const result = await extractTextFromPDF(filePath);
//     return { text: result.text, pages: result.pages };
//   } else if (
//     mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
//     ext === '.docx'
//   ) {
//     const result = await extractTextFromDOCX(filePath);
//     return { text: result.text, pages: result.pages };
//   } else if (
//     mime.startsWith('image/') ||
//     ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.bmp' || ext === '.tif' || ext === '.tiff'
//   ) {
//     const text = await extractTextFromImage(filePath);
//     return { text, pages: 1 };
//   } else if (mime === 'text/plain' || ext === '.txt') {
//     const text = await fs.promises.readFile(filePath, 'utf8');
//     return { text, pages: 1 };
//   } else if (mime === 'application/json' || ext === '.json') {
//     const json = await fs.promises.readFile(filePath, 'utf8');
//     return { text: json.toString(), pages: 1 };
//   } else {
//     throw new Error('Unsupported file type');
//   }
// };
const extractTextFromAny = async (filePath, mime, ext) => {
  if (
    mime === 'application/pdf' ||
    ext === '.pdf'
  ) {
    const result = await extractTextFromPDF(filePath);
    return { text: result.text, pages: result.pages };
  } else if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === '.docx'
  ) {
    const result = await extractTextFromDOCX(filePath);
    return { text: result.text, pages: result.pages };
  } else if (
    mime.startsWith('image/') ||
    ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.bmp' || ext === '.tif' || ext === '.tiff'
  ) {
    const text = await extractTextFromImage(filePath);
    return { text, pages: 1 };
  } else if (mime === 'text/plain' || ext === '.txt') {
    const text = await fs.promises.readFile(filePath, 'utf8');
    return { text, pages: 1 };
  } else if (mime === 'application/json' || ext === '.json') {
    const json = await fs.promises.readFile(filePath, 'utf8');
    return { text: json.toString(), pages: 1 };
  } else {
    throw new Error('Unsupported file type');
  }
};


// --- Gemini API call for document analysis ---
const callGeminiFlash = async (text) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `
You are an expert legal assistant whose primary responsibility is to protect the user. Carefully read the legal document below and return a detailed, user-centric analysis that simplifies legal jargon and highlights any content that could negatively affect the user.

Responsibilities:
- Detect hidden risks, vague obligations, or legal traps.
- Identify terms that favor the other party.
- Explain complex sections in plain language.
- Suggest how users can protect themselves or renegotiate.

Important:
- Do NOT use bold (**), italic (*), backticks (\`\`\`), or markdown formatting.
- Use bullet points where necessary.
- Return valid, raw JSON only:
{
  "summary": "...",
  "clauses": ["..."],
  "risks": ["..."],
  "suggestions": ["..."],
  "pageMetadata": {
    "1": "Page 1 summary and key content...",
    "2": "Page 2 summary and key content..."
  }
}

Here is the document:
"""${text.slice(0, 100000)}"""
`.trim();

  try {
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0 }
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    let raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!raw) throw new Error('Empty response from Gemini');

    // ✅ Remove non-JSON text before and after actual JSON block
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('Response does not contain valid JSON structure');
    }

    const jsonString = raw.substring(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.summary || !parsed.clauses || !parsed.risks || !parsed.suggestions) {
        throw new Error('Missing expected keys in parsed JSON');
      }
      return parsed;
    } catch (parseErr) {
      console.error('❌ JSON Parse Error:\n', jsonString);
      throw new Error('Failed to parse Gemini response JSON');
    }
  } catch (err) {
    console.error('🔥 Gemini API Error:', err.message || err);
    throw err;
  }
};


// --- Gemini API call for chatbot ---
// Prompt of the chatbot included
const callGeminiChat = async (query, history = []) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const context = history.length > 0
    ? `Chat history to understand context:\n${history.join('\n')}\n\nUser's current question: ${query}`
    : `User's question: ${query}`;

const prompt = `You are a trusted Indian legal assistant trained on Indian laws, Constitution, court judgments, and legal commentaries. Your role is to help users with clear, simple legal guidance — like a knowledgeable friend.

# Response Format
- Keep replies short and helpful.
- Use dash-based points. Each point must start with "- " and appear on a new line (\\n), but do not return \\n in output — it's for HTML rendering.
- Avoid legal jargon. Use simple Indian English.
- Paragraphs must be short. If bullet points are used, separate them line by line.
- No markdown or symbols.

# Accuracy & Law
- Only mention law/sections when fully sure.
- If unsure, say so — don't guess.
- Focus on settled laws and real-world steps. Avoid complex interpretations.

# Context & History
- Use chat history only for reference, not to respond.
- Always reply to the **current** query only.
- If a past user query was unrelated to law, note it silently but don’t refuse future valid legal questions.

# Query Scope
- Answer only Indian legal queries.
- If query is off-topic (tech, travel, etc.), say: "Please ask legal queries only. I'm here to help with Indian legal matters and constitutional questions."

# Ethics & Safety
- Prioritize safety — especially in emergencies.
- Never promote illegal advice.
- For sensitive issues (like domestic violence), also mention support services.

# Disclaimer
- End with: "This is general legal guidance. For personal advice, consult a lawyer."
- Skip disclaimer for greetings or non-legal talk.

Now respond to this query:

${context}
`.trim();







  const body = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7
    }
  };

  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    || 'Sorry, I could not process your query. Please try again.';
};


// --- Translate all analysis fields ---
const translateAnalysisFields = async (analysis, lang) => {
  const translated = { ...analysis };
  translated.summary = (await translate.translate(analysis.summary, lang))[0];
  translated.clauses = await Promise.all(
    (analysis.clauses || []).map(c => translate.translate(c, lang).then(([t]) => t))
  );
  translated.risks = await Promise.all(
    (analysis.risks || []).map(r => translate.translate(r, lang).then(([t]) => t))
  );
  translated.suggestions = await Promise.all(
    (analysis.suggestions || []).map(s => translate.translate(s, lang).then(([t]) => t))
  );
  if (analysis.pageMetadata) {
    const meta = analysis.pageMetadata;
    const newMeta = {};
    for (const key in meta) {
      newMeta[key] = (await translate.translate(meta[key], lang))[0];
    }
    translated.pageMetadata = newMeta;
  }
  return translated;
};

// --- Main analysis endpoint: upload, analyze, cache, and translate ---
router.post('/analyze', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const mime = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();

    const { text, pages } = await extractTextFromAny(file.path, mime, ext);
    fs.unlinkSync(file.path); // cleanup uploaded file

    const requestedLang = req.body.language || 'en';
    const cacheKey = getCacheKey(text, requestedLang);

    // Return cached result if available
    if (analysisCache.has(cacheKey)) {
      return res.json({
        status: 'completed',
        analysisId: cacheKey,
        analysis: analysisCache.get(cacheKey),
      });
    }

    const parsed = await callGeminiFlash(text);
    let resultAnalysis = {
      summary: parsed.summary,
      clauses: parsed.clauses,
      risks: parsed.risks,
      suggestions: parsed.suggestions,
      pageMetadata: parsed.pageMetadata || {},
      fullText: text,
      _meta: {
        pages,
        pageMetadata: parsed.pageMetadata || {},
      },
    };

    if (requestedLang !== 'en') {
      resultAnalysis = await translateAnalysisFields(resultAnalysis, requestedLang);
    }

    analysisCache.set(cacheKey, resultAnalysis);

    return res.json({
      status: 'completed',
      analysisId: cacheKey,
      analysis: resultAnalysis,
    });
  } catch (err) {
    console.error('Error during analysis:', err.message || err);
    return res.status(500).json({ status: 'error', error: 'Analysis failed' });
  }
});


// --- Retrieve analysis by ID (with on-the-fly translation if needed) ---
// Language code is retreiving
router.get('/analysis/:id', async (req, res) => {
  const { id } = req.params;
  const { lang = 'en' } = req.query;

  const analysis = analysisCache.get(id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }

  let result = analysis;
  if (lang !== 'en') {
    try {
      result = await translateAnalysisFields(analysis, lang);
      result.fullText = analysis.fullText;
      result._meta = {
        pages: analysis._meta.pages,
        pageMetadata: result.pageMetadata || {},
      };
    } catch (err) {
      console.error('Translation error:', err);
    }
  }

  res.json(result);
});

// --- Chatbot endpoint for general legal Q&A ---
router.post('/assist', async (req, res) => {
  const { query, language = 'en', history = [] } = req.body;

  try {
    let reply = await callGeminiChat(query, history);

    // Translate reply if needed
    if (language !== 'en') {
      reply = (await translate.translate(reply, language))[0];
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      reply: 'I apologize, but I encountered an error. Please try again later.'
    });
  }
});

// --- Chatbot endpoint for document-specific Q&A (with translation) ---
router.post('/chat', async (req, res) => {
  const { query, fullText, metadata, language = 'en' } = req.body;

  if (!query || !fullText || !metadata) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    let matchedPages = [];
    let extractedSections = '';
    if (metadata?.pageMetadata && typeof metadata.pageMetadata === 'object') {
      const matches = Object.entries(metadata.pageMetadata).filter(
        ([_, content]) =>
          typeof content === 'string' &&
          content.toLowerCase().includes(query.toLowerCase())
      );
      matchedPages = matches.map(([page]) => parseInt(page));
      extractedSections = matches
        .map(([page, content]) => `Page ${page}: ${content}`)
        .join('\n\n');
    }

    const geminiQuery = `
You are a highly reliable legal assistant. A user has asked the following question about a legal document:

"${query}"

Please analyze the document carefully and respond in plain, professional language.

Instructions:
- Avoid using any Markdown formatting (like **bold**, *italic*, or backticks).
- If your answer is based on a specific clause or statement, quote that statement exactly as it appears in the document.
- Clearly mention the page number where the quoted statement was found, if applicable.
- Be concise, legally aware, and focused on the user's safety or clarity.
- If the answer requires assumptions, clearly state that they are assumptions.

Relevant page summaries (may help):

${extractedSections || 'None detected.'}

Full document text (only search if needed):

"""${fullText.slice(0, 100000)}"""
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: geminiQuery }]
        }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    let reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Translate reply if needed
    if (language !== 'en') {
      try {
        reply = (await translate.translate(reply, language))[0];
      } catch (translateErr) {
        console.error('Translation error:', translateErr);
        // Proceed without translation if error occurs
      }
    }

    res.json({ reply, pages: matchedPages });
  } catch (err) {
    console.error('🔥 Chat API Error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Chat query failed' });
  }
}); 

module.exports = router;
