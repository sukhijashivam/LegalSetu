/// <reference types="vite/client" />
import React, { useState, useRef, useEffect } from 'react';

import { Send, Mic, MicOff, Sparkles, Brain, Zap, MessageCircle, Globe, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import ChatHeader from './ChatHeader.tsx';
import { useTranslation } from '../contexts/TranslationContext';
const apiUrl = import.meta.env.VITE_API_URL;
import { Trash2 } from 'lucide-react';
import LocalizedText from './LocalizedText.tsx';
import VoicePlayer from './VoicePlayer.tsx';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'typing';
  language?: string;
}

const defaultSuggestions = [
  'Can my landlord evict me without notice in India?',
  'What should I do if I was fired without reason?',
  'How to file a workplace harassment complaint?',
  'Are verbal contracts valid under Indian law?',
  'What are my rights if police arrest me?',
];

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { language, headerTitle, headerSubtitle, t } = useTranslation();
  const [suggestions, setSuggestions] = useState<string[]>(defaultSuggestions);
  const [inputPlaceholder, setInputPlaceholder] = useState('Ask something about Indian law...');

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    let isMounted = true;
    const translateAll = async () => {
      const translatedSuggestions = await Promise.all(defaultSuggestions.map((s) => t(s)));
      const translatedPlaceholder = await t('Ask something about Indian law...');
      if (isMounted) {
        setSuggestions(translatedSuggestions);
        setInputPlaceholder(translatedPlaceholder);
      }
    };
    translateAll();
    return () => {
      isMounted = false;
    };
  }, [language, t]);

  const sendMessage = (msg?: string) => {
    if (isThinking) return;
    const text = msg || inputText.trim();
    if (!text) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      language,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    triggerBotReply(text);
  };

  const triggerBotReply = async (userMessage: string) => {
    setIsThinking(true);
    const thinkingMsg: Message = { id: 'typing', text: '', sender: 'typing' };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const userHistory = messages.filter((m) => m.sender === 'user').map((m) => m.text).slice(-5);
      const response = await fetch(`${apiUrl}/api/assist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          language: language,
          history: userHistory,
        }),
      });

      const data = await response.json();
      const botReply = data.reply || 'Sorry, I couldnt find an answer.';
      setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));
      animateBotTyping(botReply);
    } catch (err) {
      console.error('❌ API Error:', err);
      setMessages((prev) => prev.filter((msg) => msg.id !== 'typing'));
      animateBotTyping('⚠️ Failed to get a response. Please try again.');
    }
  };

  const animateBotTyping = (fullText: string) => {
    const botId = Date.now().toString();
    const botMessage: Message = { id: botId, text: '', sender: 'bot' };
    setMessages((prev) => [...prev, botMessage]);
    setTypingId(botId);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= fullText.length) {
        clearInterval(interval);
        setTypingId(null);
        setIsThinking(false);
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, text: fullText.slice(0, i + 1) } : m))
        );
        i++;
      }
    }, 20);
  };

  const toggleMic = () => {
    if (isThinking) return;

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (!isRecording) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = language || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
        sendMessage(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const localizedText = {
    headerTitle: "Neeti AI",
    headerSubtitle: "Your intelligent legal companion - powered by advanced AI.",
    welcomeMessage: "Hello! I'm Neeti, your AI legal assistant. How can I help you today?",
  };

  // Load chat history from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('chatMessages');
    if (saved) {
      try {
        const parsed: Message[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error('❌ Failed to parse saved chat:', error);
      }
    }
  }, []);

  // Debounced save to sessionStorage on message updates
  useEffect(() => {
    const timeout = setTimeout(() => {
      sessionStorage.setItem('chatMessages', JSON.stringify(messages));
    }, 500);

    return () => clearTimeout(timeout);
  }, [messages]);

  const [clearing, setClearing] = useState(false);

  const handleClearChat = () => {
    setClearing(true);
    setTimeout(() => {
      setMessages([]);
      sessionStorage.removeItem("chatHistory");
      setClearing(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4">
      {/* Enhanced Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        <ChatHeader title={localizedText.headerTitle} subtitle={localizedText.headerSubtitle} />
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Enhanced Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          {/* AI Status Card */}
          {/* <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Neeti AI</h3>
                <p className="text-sm text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Online & Ready
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span className="font-medium text-blue-600">&lt;1s</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Accuracy</span>
                <span className="font-medium text-green-600">99.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Languages</span>
                <span className="font-medium text-purple-600">15+</span>
              </div>
            </div>
          </motion.div> */}

          {/* Enhanced Suggestions */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  <LocalizedText text='Quick Start' />
                </h2>
                <p className="text-sm text-gray-600">
                  <LocalizedText text='Try these popular questions' />
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {suggestions.map((s, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`w-full px-4 py-3 text-sm text-left font-medium rounded-2xl border transition-all duration-300 shadow-sm group ${
                    isThinking
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100'
                      : 'bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onClick={() => sendMessage(s)}
                  disabled={isThinking}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex-1">{s}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Voice Agent Button */}
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => window.open('https://vapi.ai?demo=true&shareKey=2b71c306-a98f-4400-b3a0-82a78c7a9922&assistantId=5a622d2a-960e-47e5-99ac-159b30141e09', '_blank')}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Mic className="w-5 h-5" />
            Talk to Neeti
          </motion.button>

          {/* Enhanced Clear Chat Button */}
          <motion.button
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={handleClearChat}
            disabled={isThinking}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-sm font-semibold text-red-600 border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Trash2 className="w-5 h-5" />
            <LocalizedText text="Clear Conversation" />
          </motion.button>
        </aside>

        {/* Enhanced Chat Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="lg:col-span-3 flex flex-col h-[600px] bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Enhanced Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold"><LocalizedText text="Legal Chat Assistant" /></h3>
                  <p className="text-blue-100 flex items-center gap-4">
  <span className="flex items-center">
    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
    <LocalizedText text="AI-powered" />
  </span>
  <span className="flex items-center">
    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
    <LocalizedText text="Multilingual" />
  </span>
  <span className="flex items-center">
    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
    <LocalizedText text="Instant" />
  </span>
</p>

                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                  {messages.filter(m => m.sender === 'user').length} <LocalizedText text="questions asked" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Chat Body */}
          <div ref={chatRef} className="flex-1 p-6 space-y-6 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50">
            <AnimatePresence initial={false}>
              {/* Enhanced Welcome Message */}
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-end gap-3 max-w-[85%]">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-lg">
                    🤖
                  </div>
                  <div className="relative px-6 py-4 text-sm rounded-3xl shadow-lg bg-white border border-gray-200 rounded-bl-lg">
                    <div className="font-medium text-gray-800 mb-1">
                      <LocalizedText text={localizedText.welcomeMessage} />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-500"><LocalizedText text="Powered by Advanced AI" /></span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Messages */}
              <AnimatePresence mode="sync">
                {!clearing &&
                  messages.map((msg) =>
                    msg.sender === 'typing' ? (
                      <motion.div
                        key="thinking"
                        className="flex justify-start"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <div className="flex items-end gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg">
                            🤖
                          </div>
                          <div className="px-6 py-4 bg-white border border-gray-200 rounded-3xl rounded-bl-lg flex items-center gap-3 text-sm shadow-lg">
                            <div className="flex space-x-1">
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150" />
                              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-300" />
                            </div>
                            <span className="text-gray-600 font-medium">
                              <LocalizedText text='Analyzing your question...' />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <div className="flex items-end gap-3 max-w-[85%]">
                          {msg.sender === 'bot' && (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-lg shadow-lg">
                              🤖
                            </div>
                          )}

                          <div
                            className={`group relative px-6 py-4 text-sm rounded-3xl transition-all duration-300 shadow-lg ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-lg'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-lg hover:shadow-xl'
                            }`}
                          >
                            {msg.text.split('\n').map((line, i) => (
                              <p
                                key={i}
                                className={`mb-1 whitespace-pre-wrap ${
                                  line.trim().startsWith('-') ? 'pl-4 list-disc list-inside' : ''
                                }`}
                              >
                                {line}
                              </p>
                            ))}

                            {msg.sender === 'bot' && (
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <VoicePlayer text={msg.text} />
                              </div>
                            )}

                            {/* Message timestamp */}
                            <div className={`text-xs mt-2 ${
                              msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date().toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>

                          {msg.sender === 'user' && (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 text-white flex items-center justify-center text-lg font-semibold shadow-lg">
                              👤
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  )}
              </AnimatePresence>
            </AnimatePresence>
          </div>

          {/* Enhanced Chat Input */}
          <div className="p-6 border-t bg-white/90 backdrop-blur">
  <div className="flex items-center gap-4">
    <div className="relative flex-1">
      <input
        type="text"
        className={`w-full px-6 py-4 pr-16 rounded-3xl text-sm border-2 focus:outline-none transition-all duration-300 shadow-lg ${
          isThinking
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
            : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white'
        }`}
        placeholder={inputPlaceholder}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        disabled={isThinking}
      />
<button
              onClick={toggleMic}
              disabled={isThinking}
              className={`absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                isRecording
                  ? 'text-red-600 animate-pulse drop-shadow-md'
                  : 'text-gray-400 hover:text-blue-600'
              }`}
            >
              {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

    </div>

    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      onClick={() => sendMessage()}
      disabled={!inputText.trim() || isThinking}
      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Send size={20} />
    </motion.button>
  </div>
</div>

        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;