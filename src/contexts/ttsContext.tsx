// src/contexts/ttsContext.tsx
import React from 'react';

import { createContext, useContext, useState } from 'react';

interface TTSContextType {
  ttsEnabled: boolean;
  toggleTTS: () => void;
}

const TTSContext = createContext<TTSContextType>({
  ttsEnabled: true,
  toggleTTS: () => {},
});

export const useTTS = () => useContext(TTSContext);

export const TTSProvider = ({ children }: { children: React.ReactNode }) => {
  const [ttsEnabled, setTTSEnabled] = useState(true);

  const toggleTTS = () => setTTSEnabled((prev) => !prev);

  return (
    <TTSContext.Provider value={{ ttsEnabled, toggleTTS }}>
      {children}
    </TTSContext.Provider>
  );
};
