import localFont from 'next/font/local';

export const satoshi = localFont({
  src: [
    {
      path: '../app/fonts/Satoshi-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../app/fonts/Satoshi-500.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../app/fonts/Satoshi-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

export const zodiak = localFont({
  src: [
    {
      path: '../app/fonts/Zodiak-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../app/fonts/Zodiak-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-zodiak',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
