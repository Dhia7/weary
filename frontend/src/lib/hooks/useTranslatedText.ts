'use client';

import { useEffect, useState } from 'react';

const translationCache = new Map<string, string>();

type TranslateResponse = {
  success?: boolean;
  data?: { text?: string };
};

export function useTranslatedText(
  source: string | null | undefined,
  translateToFrench: boolean
) {
  const normalized = source?.trim() ?? '';
  const [text, setText] = useState(normalized);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!normalized) {
      setText('');
      setIsLoading(false);
      return;
    }

    if (!translateToFrench) {
      setText(normalized);
      setIsLoading(false);
      return;
    }

    const cacheKey = `fr:${normalized}`;
    const cached = translationCache.get(cacheKey);
    if (cached) {
      setText(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: normalized, target: 'fr' }),
    })
      .then(async (res) => {
        const data = (await res.json()) as TranslateResponse;
        if (!res.ok || !data.success || !data.data?.text) {
          throw new Error('Translation failed');
        }
        return data.data.text;
      })
      .then((translated) => {
        if (cancelled) return;
        translationCache.set(cacheKey, translated);
        setText(translated);
      })
      .catch(() => {
        if (!cancelled) setText(normalized);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [normalized, translateToFrench]);

  return { text, isLoading };
}
