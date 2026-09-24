'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getMerciTranslations } from '@/lib/i18n/merci';
import { INSTAGRAM_URL } from '@/lib/shopLinks';
import { apiFetch, getApiErrorMessage } from '@/lib/api';
import {
  bodyTextClass,
  cardClass,
  inputClass,
  pageMainNarrowClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '@/lib/content-page-styles';

const PROMO_CODE = 'MERCI15';

const labelClass =
  'block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2';

export default function MerciExperience() {
  const { user } = useAuth();
  const { isFrench } = useLanguage();
  const t = getMerciTranslations(isFrench);
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');

  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.fullName || `${user.firstName} ${user.lastName}`.trim());
    setEmail((prev) => prev || user.email);
  }, [user]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');
    setErrorMessage('');

    const payload = {
      name: name.trim(),
      email: email.trim(),
      subject: isFrench
        ? `Avis client — ${rating}/5`
        : `Customer review — ${rating}/5`,
      message: `Rating: ${rating}/5\n\n${message.trim()}`,
    };

    try {
      const res = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setErrorMessage(getApiErrorMessage(res, data));
        return;
      }
      setStatus('success');
      setSubmittedEmail(data.data?.email || payload.email);
      setMessage('');
    } catch {
      setStatus('error');
      setErrorMessage(t.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={pageShellClass}>
      <Navigation />
      <main id="main-content" className={pageMainNarrowClass}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-12 text-center"
        >
          <Image
            src="/images/logo.png"
            alt="Swisia"
            width={180}
            height={120}
            className="mx-auto mb-8 h-24 w-auto dark:hidden"
            priority
          />
          <span className="mb-8 hidden font-serif text-2xl uppercase tracking-[0.2em] text-foreground dark:block">
            Swisia
          </span>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-swisse-gold">
            {t.eyebrow}
          </p>
          <h1 className={pageTitleClass}>{t.title}</h1>
          <p className={`${pageSubtitleClass} mx-auto max-w-xl`}>{t.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className={`${cardClass} mb-8 text-center`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-swisse-gold">
            {t.promoLabel}
          </p>
          <p className="mt-4 font-sans text-3xl font-bold tracking-[0.18em] text-swisse-ink dark:text-foreground">
            {t.promoCode}
          </p>
          <p className="mt-2 font-serif text-2xl text-swisse-gold">{t.promoOff}</p>
          <p className={`${bodyTextClass} mx-auto mt-3 max-w-md text-sm`}>{t.promoNote}</p>
          <button type="button" onClick={copyCode} className={`${secondaryButtonClass} mt-6`}>
            {copied ? t.copied : t.copyCode}
          </button>
        </motion.div>

        <div className="mb-10 grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className={`${cardClass} flex flex-col`}
          >
            <h2 className="font-serif text-2xl text-swisse-ink dark:text-foreground">
              {t.instagramTitle}
            </h2>
            <p className={`${bodyTextClass} mt-3 flex-1 text-sm`}>{t.instagramBody}</p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`${primaryButtonClass} mt-8 justify-center`}
            >
              {t.instagramCta}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className={cardClass}
          >
            <h2 className="font-serif text-2xl text-swisse-ink dark:text-foreground">
              {t.reviewTitle}
            </h2>
            <p className={`${bodyTextClass} mt-3 text-sm`}>{t.reviewBody}</p>

            {status === 'success' ? (
              <div className="mt-8">
                <p className="text-swisse-ink dark:text-foreground">{t.success}</p>
                <p className={`${bodyTextClass} mt-2 text-sm`}>
                  {t.successDetail(submittedEmail)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <p className={labelClass}>{t.ratingLabel}</p>
                  <div className="flex gap-1" role="group" aria-label={t.ratingLabel}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        className={`px-2 py-1 font-serif text-2xl transition-colors ${
                          value <= rating
                            ? 'text-swisse-gold'
                            : 'text-swisse-ink/25 dark:text-muted-foreground/40'
                        }`}
                        aria-label={`${value}/5`}
                        aria-pressed={value === rating}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="merci-name" className={labelClass}>
                    {t.name}
                  </label>
                  <input
                    id="merci-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="merci-email" className={labelClass}>
                    {t.email}
                  </label>
                  <input
                    id="merci-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={255}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="merci-message" className={labelClass}>
                    {t.message}
                  </label>
                  <textarea
                    id="merci-message"
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={5000}
                    rows={4}
                    placeholder={t.messagePlaceholder}
                    className={inputClass}
                  />
                </div>
                {status === 'error' && (
                  <p className="text-sm text-red-700 dark:text-red-400">{errorMessage || t.failed}</p>
                )}
                <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
                  {isSubmitting ? t.sending : t.send}
                </button>
              </form>
            )}
          </motion.div>
        </div>

        <p className="text-center">
          <Link href="/products" className={secondaryButtonClass}>
            {t.shop}
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
