import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const BUBBLE_SOUND = require('../../assets/sounds/bubble_pop.wav');
const CHEER_SOUND = require('../../assets/sounds/cheer.mp3');
const WICKET_SOUND = require('../../assets/sounds/wicket_out.wav');
const BGM_SOUND = require('../../assets/sounds/bgm_loop.wav');

let ExpoAudio = null;
try {
  ExpoAudio = require('expo-audio');
} catch (e) {
  console.log('[Sound] expo-audio not available:', e.message);
}

class SoundService {
  constructor() {
    this.sfxEnabled = true;
    this.cheerEnabled = true; // separate toggle for crowd cheering
    this.bgmEnabled = false;
    this.commentaryEnabled = true;
    this.voiceGender = 'female'; // 'female' | 'male'

    this.bgmSoundInstance = null;
    this.isBgmLoading = false;
    this.availableVoices = [];

    this.initAudio();
  }

  async initAudio() {
    try {
      if (ExpoAudio?.setAudioModeAsync && Platform.OS !== 'web') {
        await ExpoAudio.setAudioModeAsync({
          playsInSilentMode: true,
          shouldDuckAndroid: true,
        }).catch(() => {});
      }

      // Load available voices for TTS
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        if (voices && voices.length > 0) {
          this.availableVoices = voices;
        }
      } catch (e) {
        console.log('[Sound] Speech voices query:', e.message);
      }
    } catch (err) {
      console.warn('[Sound] Init failed:', err.message);
    }
  }

  // ─── Settings Toggles ────────────────────────────────────────────────────────

  setSfxEnabled(val) {
    this.sfxEnabled = !!val;
  }

  setCheerEnabled(val) {
    this.cheerEnabled = !!val;
  }

  setCommentaryEnabled(val) {
    this.commentaryEnabled = !!val;
    if (!this.commentaryEnabled) {
      Speech.stop();
    }
  }

  setVoiceGender(gender) {
    this.voiceGender = gender === 'male' ? 'male' : 'female';
  }

  async setBgmEnabled(val) {
    this.bgmEnabled = !!val;
    if (this.bgmEnabled) {
      await this.startBgm();
    } else {
      await this.stopBgm();
    }
  }

  // ─── Sound Effects ──────────────────────────────────────────────────────────

  playAudioSource(source, volume = 0.8, force = false) {
    if (!force && !this.sfxEnabled) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
      try {
        const audio = new window.Audio(source);
        audio.volume = volume;
        audio.play().catch(() => {});
        return;
      } catch {
        // Fall through
      }
    }

    if (!ExpoAudio?.createAudioPlayer) return;
    try {
      const player = ExpoAudio.createAudioPlayer(source);
      if (player) {
        player.volume = volume;
        player.play();
      }
    } catch (err) {
      console.log('[Sound] Play error:', err.message);
    }
  }

  async playBubblePop() {
    this.playAudioSource(BUBBLE_SOUND, 0.75);
  }

  async playCheer(force = false) {
    if (!force && (!this.sfxEnabled || !this.cheerEnabled)) return;
    this.playAudioSource(CHEER_SOUND, 0.9, force);
  }

  async previewCheer() {
    this.playAudioSource(CHEER_SOUND, 0.9, true);
  }

  async playWicket() {
    this.playAudioSource(WICKET_SOUND, 0.85);
  }

  // ─── Background Music ───────────────────────────────────────────────────────

  async startBgm() {
    if (!this.bgmEnabled || this.isBgmLoading) return;
    try {
      this.isBgmLoading = true;
      await this.stopBgm();

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.Audio) {
        try {
          const audio = new window.Audio(BGM_SOUND);
          audio.loop = true;
          audio.volume = 0.25;
          audio.play().catch(() => {});
          this.bgmSoundInstance = audio;
          return;
        } catch {
          // Fall through
        }
      }

      if (ExpoAudio?.createAudioPlayer) {
        this.bgmSoundInstance = ExpoAudio.createAudioPlayer(BGM_SOUND);
        if (this.bgmSoundInstance) {
          this.bgmSoundInstance.loop = true;
          this.bgmSoundInstance.volume = 0.25;
          this.bgmSoundInstance.play();
        }
      }
    } catch (err) {
      console.log('[Sound] BGM start error:', err.message);
    } finally {
      this.isBgmLoading = false;
    }
  }

  async stopBgm() {
    try {
      if (this.bgmSoundInstance) {
        if (typeof this.bgmSoundInstance.pause === 'function') {
          this.bgmSoundInstance.pause();
        }
        if (typeof this.bgmSoundInstance.release === 'function') {
          this.bgmSoundInstance.release();
        }
        this.bgmSoundInstance = null;
      }
    } catch (err) {
      console.log('[Sound] BGM stop error:', err.message);
    }
  }

  // ─── Voice Commentary (expo-speech) ─────────────────────────────────────────

  getSpeechVoiceOptions() {
    const isFemale = this.voiceGender === 'female';
    const pitch = isFemale ? 1.15 : 0.85;
    const rate = isFemale ? 1.0 : 0.92;

    const options = { pitch, rate };

    // Select matched voice if system provides gender-tagged voices
    if (this.availableVoices && this.availableVoices.length > 0) {
      const englishVoices = this.availableVoices.filter((v) =>
        v.language && v.language.toLowerCase().startsWith('en'),
      );
      const targetGender = isFemale ? 'female' : 'male';
      const matched = englishVoices.find((v) =>
        (v.name && v.name.toLowerCase().includes(targetGender)) ||
        (v.quality && v.gender && v.gender.toLowerCase() === targetGender),
      );
      if (matched && matched.identifier) {
        options.voice = matched.identifier;
      }
    }

    return options;
  }

  speakText(text) {
    if (!this.commentaryEnabled) return;
    try {
      Speech.stop();
      const options = this.getSpeechVoiceOptions();
      Speech.speak(text, options);
    } catch (err) {
      console.log('[Sound] Speech error:', err.message);
    }
  }

  /**
   * Announce ball score or outcome:
   * 1-5: commentary within waiting time.
   * 6-10: announce the score value + trigger crowd cheer sound effect (if cheerEnabled).
   * Out: announce wicket + play wicket sound.
   */
  announceBallResult(runs, isOut, isPlayerBatting = true) {
    if (isOut) {
      this.playWicket();
      const outText = isPlayerBatting
        ? 'OUT! What a delivery! The batsman is caught!'
        : 'WICKET! You got him! He is OUT!';
      this.speakText(outText);
      return;
    }

    if (runs >= 6) {
      if (this.cheerEnabled) {
        this.playCheer();
      }

      const bigPhrases = {
        6: 'SIX! Six, six! Massive hit over deep mid-wicket!',
        7: 'SEVEN! Seven runs! Incredible shot into the upper tier!',
        8: 'EIGHT! Eight runs! What an unbelievable monster hit!',
        9: 'NINE! Nine runs! Colossal strike clean out of the ground!',
        10: 'PERFECT TEN! Ten runs! Absolute perfection! Out of the stadium!',
      };

      const announcement = bigPhrases[runs] || `${runs}! Enormous hit!`;
      this.speakText(announcement);
      return;
    }

    if (this.commentaryEnabled) {
      const commentaryPhrases = {
        1: 'One, one, one! Quick single taken.',
        2: 'Two, two, two! Great running between the wickets.',
        3: 'Three, three, three! Superb placement in the gap.',
        4: 'Four, four, four! Pierces the field right to the fence!',
        5: 'Five, five, five! Five runs on the board!',
      };
      this.speakText(commentaryPhrases[runs] || `${runs}, ${runs}, ${runs}!`);
    } else if (this.sfxEnabled) {
      const scoreWords = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five' };
      this.speakText(scoreWords[runs] || String(runs));
    }
  }

  previewVoice() {
    const isFemale = this.voiceGender === 'female';
    const sample = isFemale
      ? 'Welcome to DUDO Hand Cricket! Female commentary voice is active.'
      : 'Welcome to DUDO Hand Cricket! Male commentary voice is active.';
    this.speakText(sample);
  }
}

export const SoundManager = new SoundService();
