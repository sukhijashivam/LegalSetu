import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Highlighter from 'react-highlight-words';
import {
  Search, Sparkles, FileText, Languages,
  ChevronDown, ChevronUp, Mic, MicOff
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext'; 
import LocalizedText from './LocalizedText';
import ChatHeader from './ChatHeader';
import VoicePlayer from './VoicePlayer';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'bn', name: 'বাংলা' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'mr', name: 'मराठी' },
  { code: 'gu', name: 'ગુજરાતી' },
  { code: 'kn', name: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'മലയാളം' },
  { code: 'or', name: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'অসমীয়া' },
  { code: 'ur', name: 'اُردُو' }
];

interface ConstitutionArticle {
  article: string | number;
  title: string;
  description: string;
}

const CaseLaws: React.FC = () => {
  const { t, language } = useTranslation();
  const [articles, setArticles] = useState<ConstitutionArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ConstitutionArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState("Search by keyword or article number (e.g., 'article 14', 'equality')");
  const [expandedArticle, setExpandedArticle] = useState<string | number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    t("Search by keyword or article number (e.g., 'article 14', 'equality')").then(translated => {
      if (isMounted) setPlaceholder(translated);
    });
    return () => { isMounted = false; };
  }, [t, language]);

  useEffect(() => {
    fetch('/constitution_of_india.json')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load constitution data:', err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setExpandedArticle(null);
    if (!value.trim()) {
      setResults([]);
      return;
    }

    const match = value.match(/article\s*(\d+[A-Z]?)/i) || value.match(/^(\d+[A-Z]?)$/i);
    if (match) {
      setResults(articles.filter(a => String(a.article) === match[1]));
      return;
    }

    setResults(
      articles.filter(a =>
        (a.title && a.title.toLowerCase().includes(value.toLowerCase())) ||
        (a.description && a.description.toLowerCase().includes(value.toLowerCase()))
      )
    );
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
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

      recognition.onstart = () => setIsRecording(true);
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        setExpandedArticle(null);
        handleSearch({ target: { value: transcript } } as React.ChangeEvent<HTMLInputElement>);
      };

      recognition.start();
    } else {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleExpand = (articleId: string | number) => {
    setExpandedArticle(prev => (prev === articleId ? null : articleId));
  };

  const showArticles = (searchTerm.trim() && results.length > 0) || expandedArticle !== null;
  const showNoResults = searchTerm.trim() && results.length === 0 && expandedArticle === null;

  const expandedCard = expandedArticle !== null
    ? results.find(a => String(a.article) === String(expandedArticle))
      || articles.find(a => String(a.article) === String(expandedArticle))
    : null;

  const searchWords = searchTerm
    .replace(/article\s*\d+[A-Z]?/gi, '')
    .split(/\s+/)
    .filter(Boolean);

  const [translatedExpandedTitle, setTranslatedExpandedTitle] = useState(expandedCard?.title || '');
  const [translatedExpandedDescription, setTranslatedExpandedDescription] = useState(expandedCard?.description || '');

  useEffect(() => {
    let isMounted = true;
    if (expandedCard) {
      t(expandedCard.title).then(result => {
        if (isMounted) setTranslatedExpandedTitle(result);
      });
      t(expandedCard.description).then(result => {
        if (isMounted) setTranslatedExpandedDescription(result);
      });
    }
    return () => { isMounted = false; };
  }, [expandedCard, t, language]);

  const [translatedTitles, setTranslatedTitles] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    let isMounted = true;
    const translateAll = async () => {
      const translations: { [key: string]: string } = {};
      await Promise.all(results.map(async (article) => {
        translations[article.article] = await t(article.title);
      }));
      if (isMounted) setTranslatedTitles(translations);
    };
    translateAll();
    return () => { isMounted = false; };
  }, [results, t, language]);

  const localizedText = {
    headerTitle: "Constitutional Article Search",
    headerSubtitle: "Search and explore our constitution instantly.",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2ff] via-white to-[#f3e8ff] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <ChatHeader title={localizedText.headerTitle} subtitle={localizedText.headerSubtitle} />
      </motion.div>

      {/* Search Bar */}
     <div className="max-w-2xl mx-auto mb-8">
  <div className="relative">
    <input
      type="text"
      value={searchTerm}
      onChange={handleSearch}
      placeholder={placeholder}
      className="w-full pr-24 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all shadow text-base"
    />

    {/* Mic Button */}
    <button
      onClick={toggleMic}
      title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
      className={`absolute top-1/2 right-12 -translate-y-1/2 transition-all duration-200 ${
        isRecording
          ? 'text-red-600 animate-pulse drop-shadow-md'
          : 'text-gray-400 hover:text-blue-600'
      }`}
    >
      {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
    </button>

    {/* Search Icon */}
    <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
      <Search size={20} className="text-gray-500" />
    </div>
  </div>
</div>


      {/* Results */}
      <div className="w-full flex justify-center mb-8">
        <style>{`
          @media (max-width: 920px) {
            .custom-article-grid {
              grid-template-columns: 1fr !important;
            }
          }
          .search-highlight {
            background-color: #fff59d;
            color: #222;
            font-weight: bold;
            border-radius: 3px;
            padding: 0 2px;
          }
        `}</style>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full"
            />
          </div>
        ) : showNoResults ? (
          <div className="w-full max-w-xl flex flex-col items-center bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow text-center">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
              <span className="font-semibold text-blue-700 text-lg">
                <LocalizedText text="No articles found for your query." />
              </span>
            </div>
            <div className="text-gray-600">
              <LocalizedText text="Try a different keyword or article number." />
            </div>
          </div>
        ) : showArticles ? (
          expandedCard ? (
            <div className="w-full max-w-2xl mx-auto">
              <div
                className="w-full bg-white border border-gray-100 rounded-xl p-6 shadow-xl flex flex-col text-base cursor-pointer transition hover:shadow-2xl"
                onClick={() => setExpandedArticle(null)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-blue-700">
                      <LocalizedText text={`Article ${expandedCard.article}: `} />
                      <Highlighter
                        highlightClassName="search-highlight"
                        searchWords={searchWords}
                        autoEscape={true}
                        textToHighlight={translatedExpandedTitle}
                      />
                    </h2>
                    <div onClick={(e) => e.stopPropagation()}>
                      <VoicePlayer
                        text={`Article ${expandedCard.article}. ${translatedExpandedTitle}. ${translatedExpandedDescription}`}
                        language={language}
                      />
                    </div>
                  </div>
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                </div>
                <div className="mt-6 text-gray-700">
                  <Highlighter
                    highlightClassName="search-highlight"
                    searchWords={searchWords}
                    autoEscape={true}
                    textToHighlight={translatedExpandedDescription}
                  />
                </div>
                <div className="mt-6 text-right">
                  <span className="text-blue-500 text-sm italic">
                    <LocalizedText text="(Click anywhere to go back)" />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="custom-article-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-center items-start"
              style={{ width: "100%", maxWidth: "1400px" }}
            >
              {results.map((article) => (
                <div
                  key={article.article}
                  className="w-full bg-white border border-gray-100 rounded-xl p-4 shadow flex flex-col text-sm cursor-pointer transition hover:shadow-xl"
                  onClick={() => handleExpand(article.article)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-blue-700">
                        <LocalizedText text={`Article ${article.article}: `} />
                        <Highlighter
                          highlightClassName="search-highlight"
                          searchWords={searchWords}
                          autoEscape={true}
                          textToHighlight={translatedTitles[article.article] || article.title}
                        />
                      </h2>
                      <div onClick={(e) => e.stopPropagation()}>
                        <VoicePlayer
                          text={`Article ${article.article}. ${
                            translatedTitles[article.article] || article.title
                          }`}
                          language={language}
                        />
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
};

export default CaseLaws;