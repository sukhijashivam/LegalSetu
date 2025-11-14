import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => Promise<string>;
  headerTitle: string;
  headerSubtitle: string;
  updateHeaders: (title: string, subtitle: string) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'en',
  setLanguage: () => {},
  t: async (text: string) => text,
  headerTitle: 'Neeti',
  headerSubtitle: 'Online • Ready to help',
  updateHeaders: async () => {}
});

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('appLanguage') || 'en';
    }
    return 'en';
  });
  const [headerTitle, setHeaderTitle] = useState('Neeti');
  const [headerSubtitle, setHeaderSubtitle] = useState('Online • Ready to help');

  // Save language to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', language);
      fetchHeaders(); // Load headers when language changes
    }
  }, [language]);

  // Generic translation function
  const t = useCallback(async (text: string) => {
    if (language === 'en') return text;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: language }),
      });

      if (!response.ok) throw new Error('Translation request failed');
      
      const data = await response.json();
      return data.translation || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }, [language]);

  // Chat header management
  const fetchHeaders = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat-header/${language}`);
      if (!response.ok) throw new Error('Header fetch failed');
      
      const data = await response.json();
      setHeaderTitle(data.title);
      setHeaderSubtitle(data.subtitle);
    } catch (error) {
      console.error('Fetching headers failed, using defaults:', error);
      const defaultTitle = await t('Neeti');
      const defaultSubtitle = await t('Online • Ready to help');
      setHeaderTitle(defaultTitle);
      setHeaderSubtitle(defaultSubtitle);
      await updateHeaders(defaultTitle, defaultSubtitle);
    }
  }, [language, t]);

  const updateHeaders = useCallback(async (title: string, subtitle: string) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/chat-header`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: language, title, subtitle }),
      });
      setHeaderTitle(title);
      setHeaderSubtitle(subtitle);
    } catch (error) {
      console.error('Failed to update headers:', error);
    }
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    headerTitle,
    headerSubtitle,
    updateHeaders
  }), [language, t, headerTitle, headerSubtitle, updateHeaders]);

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
