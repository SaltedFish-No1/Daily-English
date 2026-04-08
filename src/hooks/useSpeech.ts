/**
 * @author SaltedFish-No1
 * @description Web Speech API 封装 hook，提供 TTS 发音能力。
 */

import { useCallback } from 'react';

export const useSpeech = () => {
  const speak = useCallback((word: string, lang = 'en-US', rate = 0.9) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = lang;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { speak };
};
