// Safe fallback without breaking TS
/// <reference types="vite/client" />

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type SpeechRecognition = typeof window.webkitSpeechRecognition;
type SpeechRecognitionEvent = Event & {
  results: {
    [index: number]: {
      0: { transcript: string };
    };
    length: number;
  };
};

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext.tsx';
import { motion } from "framer-motion";
import VoicePlayer from '../VoicePlayer.tsx';

interface Analysis {
  summary: string;
  clauses: string[];
  risks: string[];
  suggestions: string[];
  fullText: string;
  _meta?: {
    pages: number;
    pageMetadata: Record<string, string>;
  };
}

interface Props {
  analysis?: Analysis;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode; color?: string }> = ({
  title,
  children,
  color = 'text-neutral-900',
}) => (
  <div className="mb-6">
    <h3 className={`text-sm font-semibold mb-2 ${color}`}>{title.toUpperCase()}</h3>
    {children}
  </div>
);

const AnalysisModal: React.FC<Props> = ({ analysis, onClose }) => {
  if (!analysis) return null;

  const [chatMode, setChatMode] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);

  const { t, language } = useTranslation();
  const [typingText, setTypingText] = useState('');

  const [ui, setUI] = useState({
    chatWithDoc: 'Chat with Doc',
    viewAnalysis: 'View Analysis',
    viewDoc: 'View Document',
    hideDoc: 'Hide Document',
    legalDocAnalysis: 'Legal Document Analysis',
    summary: 'Summary',
    clauses: 'Clauses',
    risks: 'Risks',
    suggestions: 'Suggestions',
    fullDocument: 'Full Document',
    analyzing: 'Analyzing...',
    analysisComplete: 'Analysis Complete',
    errorDuringAnalysis: 'Error during analysis.',
    askPlaceholder: 'Ask something about the document...',
    send: 'Send',
    clearChat: 'Clear Chat',
downloadSummary: 'Download Summary',
downloadAnalysis: 'Download Analysis',

    
  });

  useEffect(() => {
    let mounted = true;
    const translateUI = async () => {
      const [
        chatWithDoc, viewAnalysis, viewDoc, hideDoc, legalDocAnalysis,
        summary, clauses, risks, suggestions, fullDocument,
        analyzing, analysisComplete, errorDuringAnalysis, askPlaceholder, send,clearChat, downloadSummary, downloadAnalysis
      ] = await Promise.all([
        t('Chat with Doc'),
        t('View Analysis'),
        t('View Document'),
        t('Hide Document'),
        t('Legal Document Analysis'),
        t('Summary'),
        t('Clauses'),
        t('Risks'),
        t('Suggestions'),
        t('Full Document'),
        t('Analyzing...'),
        t('Analysis Complete'),
        t('Error during analysis.'),
        t('Ask something about the document...'),
        t('Send'),
        t('Clear Chat'),
  t('Download Summary'),
  t('Download Analysis')
      ]);
      if (mounted) {
        setUI({
          chatWithDoc, viewAnalysis, viewDoc, hideDoc, legalDocAnalysis,
          summary, clauses, risks, suggestions, fullDocument,
          analyzing, analysisComplete, errorDuringAnalysis, askPlaceholder, send,clearChat, downloadSummary, downloadAnalysis
        });
      }
    };
    translateUI();
    return () => { mounted = false; };
  }, [language, t]);

 // Generate unique document hash once per analysis
const docHash = analysis?.fullText ? btoa(analysis.fullText.slice(0, 200)) : null;

// Load saved chat messages on document load
const loadChatMessages = () => {
  if (!docHash) return;

  const key = `chatMessages:${docHash}`;
  const saved = sessionStorage.getItem(key);

  try {
    const parsed = saved ? JSON.parse(saved) : [];
    if (Array.isArray(parsed)) {
      // console.log('✅ Loaded chat messages from sessionStorage:', key);
      setMessages(parsed);
    } else {
      console.warn('⚠️ Stored chat is not an array, resetting...');
      setMessages([]);
    }
  } catch (err) {
    // console.error('❌ Failed to parse chat messages:', err);
    setMessages([]);
  }

  setInput('');
  setTypingText('');
};

useEffect(() => {
  loadChatMessages();
}, [analysis]); // this ensures it runs when a new document is loaded


// Save chat messages whenever they change
const hasLoadedRef = useRef(false);

useEffect(() => {
  if (!docHash) return;

  if (!hasLoadedRef.current) {
    hasLoadedRef.current = true;
    return; // skip first run, only save after actual user interaction
  }

  const key = `chatMessages:${docHash}`;
  try {
    const data = JSON.stringify(messages);
    sessionStorage.setItem(key, data);
    // console.log('✅ Chat saved:', key);
  } catch (err) {
    // console.error('❌ Failed to save chat messages:', err);
  }
}, [messages, docHash]);



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingText]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 1);
    };

    recognitionRef.current = recognition;
  }, [language]);

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    speechSynthesis.speak(utterance);
  };

  const handleSend = async (overrideInput?: string) => {
    const query = (overrideInput ?? input).trim();
    if (!query) return;
    const timestamp = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { role: 'user', text: query, timestamp }]);
    setInput('');
    setTypingText('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          fullText: analysis.fullText,
          metadata: analysis._meta || {},
          language,
        }),
      });
      const result = await res.json();
      const reply = result.reply || '❌ Sorry, I could not process your question.';

      const words = reply.split(' ');
      let index = 0;
      const interval = setInterval(() => {
        setTypingText((prev) => prev + (index === 0 ? '' : ' ') + words[index]);
        index++;
        if (index >= words.length) {
          clearInterval(interval);
          setMessages((prev) => [
            ...prev,
            { role: 'bot', text: reply, timestamp: new Date().toLocaleTimeString() },
          ]);
          setTypingText('');
        }
      }, 80);
    } catch (err) {
      // console.error('Chat failed', err);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: '⚠️ Failed to get response. Try again later.', timestamp: new Date().toLocaleTimeString() },
      ]);
    }
  };

  const downloadSection = (section: 'summary' | 'analysis') => {
  const content = section === 'summary' ? analysis.summary : `
--- 📄 Summary ---
${analysis.summary}

--- 🔍 Clauses ---
${analysis.clauses.join('\n\n')}

--- ⚠️ Risks ---
${analysis.risks.join('\n\n')}

--- 💡 Suggestions ---
${analysis.suggestions.join('\n\n')}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${section}-download.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const handleClearChat = () => {
  sessionStorage.removeItem('chatMessages');
  setMessages([]);
  setTypingText('');
};
const [playingMessageIndex, setPlayingMessageIndex] = useState<number | null>(null);
const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);



const [clearing, setClearing] = useState(false);  



return (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
    <div className="bg-white rounded-2xl overflow-hidden w-full max-w-6xl h-[90vh] flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 md:top-4 md:right-4 text-gray-500 hover:text-gray-700 z-10"
      >
        <X size={24} />
      </button>

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setChatMode((prev) => !prev)}
              className="px-3 py-1 text-sm border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50"
            >
              {chatMode ? ui.viewAnalysis : ui.chatWithDoc}
            </button>
            <button
              onClick={() => setShowDocument((prev) => !prev)}
              className="px-3 py-1 text-sm border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50"
            >
              {showDocument ? ui.hideDoc : ui.viewDoc}
            </button>
            <button
              onClick={handleClearChat}
              className="px-3 py-1 text-sm bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 hover:scale-105 transition-transform"
              title="Clear Chat"
            >
              🧹 {ui.clearChat || 'Clear Chat'}
            </button>
           
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-4">
          {chatMode ? `💬 ${ui.chatWithDoc}` : `📄 ${ui.legalDocAnalysis}`}
        </h2>

        {chatMode ? (
          <div className="flex flex-col flex-1 min-h-0">
            <motion.div
  key={clearing ? 'clearing' : 'chat-active'}
  initial={{ opacity: 1 }}
  animate={{ opacity: clearing ? 0 : 1 }}
  transition={{ duration: 1 }}
  className="flex-1 overflow-y-auto mb-4 pr-2"
>
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                const avatar = isUser ? '🧑‍💼' : '👩‍⚖️';
                return (
                  <div
                    key={i}
                    className={`flex items-end mb-4 ${isUser ? 'justify-end' : 'justify-start'} gap-2 animate-fade-up`}
                  >
                    {!isUser && <div className="text-2xl w-8 h-8 flex items-center justify-center">{avatar}</div>}
                    <div className={`group relative max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-md ${
                      isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                      <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400">
                        <span>{msg.timestamp}</span>
                        {msg.role === 'bot' && (
  <div className="ml-2 transition-opacity duration-200 group-hover:opacity-100 opacity-0">
    <VoicePlayer text={msg.text} index={i} language={language}   />
  </div>
)}


                      </div>
                    </div>
                    {isUser && <div className="text-2xl w-8 h-8 flex items-center justify-center">{avatar}</div>}
                  </div>
                );
              })}
              {typingText && (
                <div className="flex items-end mb-4 gap-2 animate-pulse">
                  <div className="text-2xl w-8 h-8 flex items-center justify-center">👩‍⚖️</div>
                  <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 shadow-md text-sm">
                    {typingText}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </motion.div>

            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={ui.askPlaceholder}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring focus:ring-blue-500"
              />
              <button
                onClick={() => recognitionRef.current?.start()}
                type="button"
                className={`p-2 rounded-full border transition-all duration-200 ${
                  listening
                    ? 'bg-red-100 border-red-300 animate-pulse'
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
                title="Voice Input"
              >
                <Mic className={`h-5 w-5 ${listening ? 'text-red-500' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => handleSend()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                disabled={!input.trim()}
              >
                {ui.send}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2 animate-fade-in">
            <div className="flex justify-end gap-4 mb-4">
              <button
                onClick={() => downloadSection('summary')}
                className="px-3 py-1 text-sm bg-green-100 border border-green-300 text-green-700 rounded hover:bg-green-200 transition"
              >
                ⬇️ {ui.downloadSummary || 'Download Summary'}
              </button>
              <button
                onClick={() => downloadSection('analysis')}
                className="px-3 py-1 text-sm bg-yellow-100 border border-yellow-300 text-yellow-700 rounded hover:bg-yellow-200 transition"
              >
                ⬇️ {ui.downloadAnalysis || 'Download Analysis'}
              </button>
            </div>

            <Section title={ui.summary}>
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{analysis.summary}</p>
            </Section>
            <Section title={ui.clauses} color="text-blue-600">
              <ul className="list-disc pl-6 text-sm text-gray-700">
                {analysis.clauses.map((clause, i) => (
                  <li key={i} className="mb-2">{clause}</li>
                ))}
              </ul>
            </Section>
            <Section title={ui.risks} color="text-red-600">
              <ul className="list-disc pl-6 text-sm text-gray-700">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="mb-2">{risk}</li>
                ))}
              </ul>
            </Section>
            <Section title={ui.suggestions} color="text-green-600">
              <ul className="list-disc pl-6 text-sm text-gray-700">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="mb-2">{s}</li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </div>

      {showDocument && (
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 rounded-r-2xl animate-fade-in">
          <h3 className="text-lg font-semibold mb-4">📖 {ui.fullDocument}</h3>
          <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
            {analysis.fullText}
          </div>
        </div>
      )}
    </div>
  </div>
);

};

export default AnalysisModal;
