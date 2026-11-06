import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SoundManager } from '../services/soundManager';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
  const [sfxEnabled, setSfx] = useState(true);
  const [cheerEnabled, setCheer] = useState(true);
  const [bgmEnabled, setBgm] = useState(false);
  const [commentaryEnabled, setCommentary] = useState(true);
  const [voiceGender, setGender] = useState('female');

  const toggleSfx = useCallback(() => {
    setSfx((prev) => {
      const next = !prev;
      SoundManager.setSfxEnabled(next);
      return next;
    });
  }, []);

  const toggleCheer = useCallback(() => {
    setCheer((prev) => {
      const next = !prev;
      SoundManager.setCheerEnabled(next);
      return next;
    });
  }, []);

  const toggleBgm = useCallback(() => {
    setBgm((prev) => {
      const next = !prev;
      SoundManager.setBgmEnabled(next);
      return next;
    });
  }, []);

  const toggleCommentary = useCallback(() => {
    setCommentary((prev) => {
      const next = !prev;
      SoundManager.setCommentaryEnabled(next);
      return next;
    });
  }, []);

  const setVoiceGender = useCallback((gender) => {
    setGender(gender);
    SoundManager.setVoiceGender(gender);
  }, []);

  const playBubblePop = useCallback(() => {
    SoundManager.playBubblePop();
  }, []);

  const playCheer = useCallback((force = false) => {
    SoundManager.playCheer(force);
  }, []);

  const previewCheer = useCallback(() => {
    SoundManager.previewCheer();
  }, []);

  const playWicket = useCallback(() => {
    SoundManager.playWicket();
  }, []);

  const announceBallResult = useCallback((runs, isOut, isPlayerBatting) => {
    SoundManager.announceBallResult(runs, isOut, isPlayerBatting);
  }, []);

  const previewVoice = useCallback(() => {
    SoundManager.previewVoice();
  }, []);

  useEffect(() => {
    return () => {
      SoundManager.stopBgm();
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        sfxEnabled,
        toggleSfx,
        cheerEnabled,
        toggleCheer,
        bgmEnabled,
        toggleBgm,
        commentaryEnabled,
        toggleCommentary,
        voiceGender,
        setVoiceGender,
        playBubblePop,
        playCheer,
        previewCheer,
        playWicket,
        announceBallResult,
        previewVoice,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) {
    return {
      sfxEnabled: true,
      toggleSfx: () => {},
      cheerEnabled: true,
      toggleCheer: () => {},
      bgmEnabled: false,
      toggleBgm: () => {},
      commentaryEnabled: true,
      toggleCommentary: () => {},
      voiceGender: 'female',
      setVoiceGender: () => {},
      playBubblePop: () => SoundManager.playBubblePop(),
      playCheer: (force) => SoundManager.playCheer(force),
      previewCheer: () => SoundManager.previewCheer(),
      playWicket: () => SoundManager.playWicket(),
      announceBallResult: (...args) => SoundManager.announceBallResult(...args),
      previewVoice: () => SoundManager.previewVoice(),
    };
  }
  return ctx;
}
