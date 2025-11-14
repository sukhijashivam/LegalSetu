import React, { useEffect, useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext.tsx';

const LocalizedText: React.FC<{ text: string }> = ({ text }) => {
  const { t, language } = useTranslation();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    t(text).then(setTranslated);
  }, [text, t, language]); 

  return <>{translated}</>;
};

export default LocalizedText;
