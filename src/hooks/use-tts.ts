'use client';

import { useRef, useCallback } from 'react';
import { useChatStore } from '@/stores/chat-store';

export function useTTS() {
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { setSpeaking } = useChatStore();

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setSpeaking(false);
  }, [setSpeaking]);

  const speak = useCallback(async (text: string): Promise<void> => {
    cleanup();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error('TTS request failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;
      setSpeaking(true);

      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          cleanup();
          resolve();
        };
        audio.onerror = () => {
          cleanup();
          reject(new Error('Audio playback failed'));
        };
        audio.play().catch((err) => {
          cleanup();
          reject(err);
        });
      });
    } catch (err) {
      cleanup();
      if ((err as Error).name === 'AbortError') return;
      throw err;
    }
  }, [cleanup, setSpeaking]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    cleanup();
  }, [cleanup]);

  return { speak, stop };
}
