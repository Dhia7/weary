'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import LightRays from '@/components/LightRays';

type Lang = 'en' | 'fr';

const COPY: Record<
  Lang,
  { eyebrow: string; quote: string[]; sub: string; footer: string }
> = {
  en: {
    eyebrow: 'WELCOME TO SWISIA',
    quote: ['Swiss Luxury,', 'Delivered to Your Door.'],
    sub: 'From Geneva to Tunisia — no middlemen, no compromise.',
    footer: 'swisia.store',
  },
  fr: {
    eyebrow: 'BIENVENUE CHEZ SWISIA',
    quote: ['Le Luxe Suisse,', 'Livré Chez Vous.'],
    sub: 'De Genève à la Tunisie — sans intermédiaire, sans compromis.',
    footer: 'swisia.store',
  },
};

export default function SwisiaLaunchScene({ lang = 'fr' }: { lang?: Lang }) {
  const copy = COPY[lang];

  return (
    <div
      data-launch-scene
      className="relative h-[100dvh] w-full overflow-hidden bg-[#FAF8F5] text-[#2D2416]"
    >
      {/* React Bits Light Rays — Swisia gold on first-post canvas */}
      <LightRays
        raysOrigin="top-center"
        raysColor="#C5A059"
        raysSpeed={1}
        lightSpread={0.9}
        rayLength={2.2}
        fadeDistance={1.05}
        saturation={1}
        followMouse={false}
        mouseInfluence={0}
        noiseAmount={0.03}
        distortion={0.05}
        pulsating={false}
      />

      {/* Soft vignette so text stays readable over rays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(250,248,245,0.05) 0%, rgba(250,248,245,0.45) 50%, rgba(250,248,245,0.82) 100%)',
        }}
      />

      {/* Soft logo watermark like the static first post */}
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-[0.08]">
        <Image
          src="/images/logo.png"
          alt=""
          width={720}
          height={720}
          className="h-[55vmin] w-auto"
          priority
        />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <Image
            src="/images/logo.png"
            alt="Swisia"
            width={220}
            height={220}
            priority
            className="mb-10 h-[18vmin] w-auto max-h-36"
          />

          <p className="mb-4 text-[clamp(10px,2.2vmin,13px)] font-semibold uppercase tracking-[0.35em] text-[#C5A059]">
            {copy.eyebrow}
          </p>
          <div className="mb-8 h-0.5 w-20 bg-[#C5A059]" />

          <h1 className="font-serif text-[clamp(1.75rem,6.5vmin,3.75rem)] leading-[1.15] text-[#2D2416]">
            {copy.quote.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-8 max-w-[28rem] text-[clamp(0.9rem,2.8vmin,1.15rem)] leading-relaxed text-[#2D2416]/70">
            {copy.sub}
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.15, duration: 0.9 }}
          className="absolute bottom-[4.5%] text-[clamp(11px,2.2vmin,14px)] tracking-[0.22em] text-[#C5A059]"
        >
          {copy.footer}
        </motion.p>
      </div>
    </div>
  );
}
