const axios = require('axios');

const CACHE_MAX = 500;
const cache = new Map();

function trimCache() {
  if (cache.size <= CACHE_MAX) return;
  const oldest = cache.keys().next().value;
  cache.delete(oldest);
}

const UNUSABLE_TRANSLATION = /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE PAIR|PLEASE SELECT TWO DISTINCT/i;

function isUsableTranslation(text) {
  return Boolean(text) && !UNUSABLE_TRANSLATION.test(text);
}

function splitOversized(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const parts = [];
  let rest = text.trim();
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf(' ', maxLen);
    if (cut < Math.floor(maxLen * 0.5)) cut = maxLen;
    parts.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push(rest);
  return parts;
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

  const sized = (chunks.length > 0 ? chunks : [text]).flatMap((chunk) => splitOversized(chunk, maxLen));
  return sized.filter(Boolean);
}

const MAX_CONCURRENT_CHUNKS = 2;
let activeChunks = 0;
const chunkWaiters = [];

function withChunkSlot(task) {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeChunks += 1;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          activeChunks -= 1;
          const next = chunkWaiters.shift();
          if (next) next();
        });
    };
    if (activeChunks < MAX_CONCURRENT_CHUNKS) run();
    else chunkWaiters.push(run);
  });
}

let myMemoryDisabled = false;

async function translateWithMyMemory(chunk, targetLang) {
  const langpair = targetLang === 'fr' ? 'en|fr' : 'fr|en';
  const params = { q: chunk, langpair };
  if (process.env.MYMEMORY_EMAIL) {
    params.de = process.env.MYMEMORY_EMAIL;
  }

  const { data } = await axios.get('https://api.mymemory.translated.net/get', {
    params,
    timeout: 12_000,
    validateStatus: () => true,
  });

  const status = Number(data?.responseStatus);
  const translated = data?.responseData?.translatedText?.trim();
  if (status === 429 || /FREE TRANSLATIONS/i.test(translated || '')) {
    myMemoryDisabled = true;
  }
  if (status !== 200 || !isUsableTranslation(translated)) {
    throw new Error(translated || 'Empty translation response');
  }
  return translated;
}

async function translateWithGoogle(chunk, targetLang) {
  const source = targetLang === 'fr' ? 'en' : 'fr';
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', source);
  url.searchParams.set('tl', targetLang);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', chunk);

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) {
    throw new Error(`Translation request failed (${res.status})`);
  }

  const data = await res.json();
  const parts = Array.isArray(data?.[0]) ? data[0].map((row) => row?.[0] || '').join('') : '';
  const translated = parts.trim();
  if (!translated) {
    throw new Error('Empty translation response');
  }
  return translated;
}

async function requestChunk(chunk, targetLang) {
  if (!myMemoryDisabled) {
    try {
      return await translateWithMyMemory(chunk, targetLang);
    } catch (error) {
      if (myMemoryDisabled || /429|FREE TRANSLATIONS|MYMEMORY WARNING/i.test(error.message || '')) {
        myMemoryDisabled = true;
      }
    }
  }
  return translateWithGoogle(chunk, targetLang);
}

async function translateChunk(chunk, targetLang) {
  return withChunkSlot(() => requestChunk(chunk, targetLang));
}

async function translateText(text, targetLang = 'fr') {
  const normalized = String(text || '').trim();
  if (!normalized) return normalized;

  const cacheKey = `${targetLang}:${normalized}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (isUsableTranslation(cached)) return cached;
    cache.delete(cacheKey);
  }

  const chunks = splitForTranslation(normalized);
  const translatedChunks = [];
  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk, targetLang));
  }

  const joiner = /\n\s*\n/.test(normalized) ? '\n\n' : ' ';
  const result = translatedChunks.join(chunks.length > 1 ? joiner : '');
  cache.set(cacheKey, result);
  trimCache();
  return result;
}

module.exports = { translateText };
