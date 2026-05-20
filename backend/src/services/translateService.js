const axios = require('axios');

const CACHE_MAX = 500;
const cache = new Map();

function trimCache() {
  if (cache.size <= CACHE_MAX) return;
  const oldest = cache.keys().next().value;
  cache.delete(oldest);
}

function splitForTranslation(text, maxLen = 450) {
  if (text.length <= maxLen) return [text];

  const paragraphs = text.split(/\r?\n\r?\n/);
  const chunks = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxLen) {
      chunks.push(paragraph);
      continue;
    }
    const sentences = paragraph.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [paragraph];
    let buffer = '';
    for (const sentence of sentences) {
      const next = buffer ? `${buffer} ${sentence.trim()}` : sentence.trim();
      if (next.length > maxLen && buffer) {
        chunks.push(buffer);
        buffer = sentence.trim();
      } else {
        buffer = next;
      }
    }
    if (buffer) chunks.push(buffer);
  }

  return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
}

async function translateChunk(chunk, targetLang) {
  const langpair = targetLang === 'fr' ? 'en|fr' : 'fr|en';
  const params = { q: chunk, langpair };
  if (process.env.MYMEMORY_EMAIL) {
    params.de = process.env.MYMEMORY_EMAIL;
  }

  const { data } = await axios.get('https://api.mymemory.translated.net/get', {
    params,
    timeout: 12_000,
  });

  const translated = data?.responseData?.translatedText?.trim();
  if (!translated) {
    throw new Error('Empty translation response');
  }
  return translated;
}

async function translateText(text, targetLang = 'fr') {
  const normalized = String(text || '').trim();
  if (!normalized) return normalized;

  const cacheKey = `${targetLang}:${normalized}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const chunks = splitForTranslation(normalized);
  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk, targetLang));
  }

  const result = translatedChunks.join(chunks.length > 1 ? '\n\n' : '');
  cache.set(cacheKey, result);
  trimCache();
  return result;
}

module.exports = { translateText };
