import React, { useEffect, useRef, useState } from 'react';
import { useTTS } from '../contexts/ttsContext';


interface VoicePlayerProps {
  text: string;
  language?: string;
  index?: number;
}

const API_BASE = import.meta.env.VITE_API_URL;


const VoicePlayer: React.FC<VoicePlayerProps> = ({ text, language = 'en' }) => {
  const { ttsEnabled } = useTTS();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState(false); // separate loading flag

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!ttsEnabled || !text?.trim() || isFetchingAudio) return;

    setIsFetchingAudio(true);

    try {
      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      const res = await fetch(`${API_BASE}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      const data = await res.json();
      if (!data.audioUrl) throw new Error('TTS audio failed');

      const audioUrl = `${API_BASE}${data.audioUrl}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.play().then(() => {
        setIsPlaying(true);
        setIsFetchingAudio(false);
      }).catch((err) => {
        // console.error('🔈 Playback error:', err);
        setIsPlaying(false);
        setIsFetchingAudio(false);
      });

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        // console.error('🎵 Audio failed to load/play:', e);
        setIsPlaying(false);
        setIsFetchingAudio(false);
        audioRef.current = null;
      };
    } catch (err) {
      // console.error('❌ TTS Error:', err);
      setIsPlaying(false);
      setIsFetchingAudio(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  const isButtonDisabled = isFetchingAudio && !isPlaying;

  return (
    <button
      onClick={isPlaying ? handleStop : handlePlay}
      title={isPlaying ? 'Stop voice playback' : 'Play voice'}
      disabled={isButtonDisabled}
      className={`p-1 rounded-full transition-colors duration-200 ${
        isPlaying
          ? 'text-blue-600 hover:text-blue-700'
          : isButtonDisabled
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      {isFetchingAudio && !isPlaying ? '⏳' : isPlaying ? '⏹️' : '🔊'}
    </button>
  );
};

export default VoicePlayer;
