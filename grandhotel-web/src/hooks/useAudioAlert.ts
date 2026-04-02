/**
 * useAudioAlert — Sesli bildirim hook'u
 *
 * Mutfak ekranında yeni sipariş geldiğinde şiddetli bildirim sesi çalar.
 * Tarayıcı politikası gereği ilk ses çalma kullanıcı etkileşimi gerektirir.
 *
 * Kullanım:
 *   const { play, enable } = useAudioAlert();
 *   // Kullanıcı butona tıkladığında:
 *   enable();  // Tarayıcı ses iznini aktifleştir
 *   // Yeni sipariş geldiğinde:
 *   play();    // Bildirim sesini çal
 */

import { useRef, useCallback, useState } from 'react';

const DEFAULT_SOUND = '/sounds/kitchen-bell.wav';

interface UseAudioAlertOptions {
  soundUrl?: string;
  volume?: number;
}

export default function useAudioAlert(options?: UseAudioAlertOptions) {
  const soundUrl = options?.soundUrl || DEFAULT_SOUND;
  const volume = options?.volume ?? 0.8;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  /**
   * Tarayıcı ses iznini aktifleştir.
   * Kullanıcı etkileşimi (tıklama) ile çağrılmalı.
   */
  const enable = useCallback(() => {
    const audio = new Audio(soundUrl);
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      audioRef.current = audio;
      setIsEnabled(true);
    }).catch(() => {
      // Tarayıcı izin vermedi
      console.warn('[Audio] Ses izni alınamadı');
    });
  }, [soundUrl, volume]);

  /**
   * Bildirim sesini çal.
   */
  const play = useCallback(() => {
    if (!audioRef.current) {
      // Henüz enable edilmemiş, yeni audio dene
      const audio = new Audio(soundUrl);
      audio.volume = volume;
      audio.play().catch(() => {});
      return;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
  }, [soundUrl, volume]);

  return { play, enable, isEnabled };
}
