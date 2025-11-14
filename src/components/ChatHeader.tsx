import React from 'react';
import { Languages, FileText, Sparkles, Zap, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '../contexts/TranslationContext.tsx';
import LocalizedText from './LocalizedText';

interface ChatHeaderProps {
  title: string;
  subtitle: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, subtitle }) => {
  const { language, setLanguage } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'ur', name: 'اُردُو', flag: '🇵🇰' }
  ];

  const currentLang = languages.find(lang => lang.code === language) || languages[0];


  return (
    <div className="w-full px-4 sm:px-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 mb-8 p-6 sm:p-8 overflow-hidden relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            {/* Enhanced Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl flex items-center justify-center shadow-2xl flex-shrink-0"
              >
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                <div className="absolute -top-2 -right-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
                  </motion.div>
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  <LocalizedText text={title} />
                </h2>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-sm font-semibold text-green-600 whitespace-nowrap">
                      <LocalizedText text={subtitle} />
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-yellow-500" />
                      <span><LocalizedText text="Instant" /></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span><LocalizedText text="Secure" /></span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="w-3 h-3 text-blue-500" />
                      <span><LocalizedText text="Multilingual" /></span>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">99.2% <LocalizedText text="Accuracy" /></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">&lt;1s <LocalizedText text="Response" /></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">15+ <LocalizedText text="Languages" /></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Language Selector */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0"
            >
              <div className="flex items-center space-x-3 px-4 py-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Language:</span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent border-none focus:outline-none text-sm font-semibold text-gray-800 cursor-pointer min-w-0"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Current Language Display */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200 whitespace-nowrap">
                <span className="text-lg">{currentLang.flag}</span>
                <span className="text-sm font-medium text-blue-700">{currentLang.name}</span>
              </div>
            </motion.div>
          </div>

          {/* Additional Info Bar */}
          {/* <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 pt-6 border-t border-gray-200/50 overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 text-sm">
              <div className="flex items-center space-x-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    🤖
                  </div>
                  <span className="font-medium">AI-Powered Legal Assistant</span>
                </div>
                <div className="hidden xl:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    ⚖️
                  </div>
                  <span className="font-medium">Trained on Indian Law</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  <LocalizedText text="Free to use" />
                </span>
              </div>
            </div>
          </motion.div> */}
        </div>
      </motion.div>
    </div>
  );
};

export default ChatHeader;