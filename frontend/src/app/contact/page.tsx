'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Mail, Instagram, Clock, Send, CheckCircle } from 'lucide-react';
import { apiFetch, getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getContactTranslations } from '@/lib/i18n/contact';
import { CONTACT_EMAIL, INSTAGRAM_HANDLE, INSTAGRAM_URL } from '@/lib/shopLinks';

const inputClassName =
  'w-full px-4 py-3 border border-swisse-gold/25 dark:border-border bg-transparent text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground focus:outline-none focus:border-swisse-gold dark:focus:border-primary transition-colors';

const labelClassName =
  'block text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-2';

function clipSubject(value: string) {
  return value.length <= 200 ? value : value.slice(0, 197) + '…';
}

function ContactPageInner() {
  const { user } = useAuth();
  const { isFrench } = useLanguage();
  const t = getContactTranslations(isFrench);
  const searchParams = useSearchParams();
  const soldName = searchParams.get('name');
  const soldSku = searchParams.get('sku');
  const soldSlug = searchParams.get('slug');
  const isSoldInquiry = searchParams.get('reason') === 'sold' && Boolean(soldName);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [confirmationEmailSent, setConfirmationEmailSent] = useState(false);

  useEffect(() => {
    setFormData((prev) => {
      const next = { ...prev };
      if (user) {
        if (!next.name.trim()) {
          next.name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.fullName || '';
        }
        if (!next.email.trim()) next.email = user.email || '';
        if (!next.phone.trim() && user.phone) next.phone = user.phone;
      }
      if (isSoldInquiry && soldName) {
        const listingPath = soldSlug ? `/product/${soldSlug}` : '';
        const generatedSubject = clipSubject(t.soldInquirySubject(soldName, soldSku));
        const generatedMessage = t.soldInquiryMessage(soldName, soldSku, listingPath);
        const subjectUntouched =
          !prev.subject.trim() ||
          prev.subject === clipSubject(t.soldInquirySubject(soldName, soldSku)) ||
          prev.subject.startsWith('Looking for:') ||
          prev.subject.startsWith('Recherche :');
        const messageUntouched =
          !prev.message.trim() ||
          prev.message.startsWith('Hello,') ||
          prev.message.startsWith('Bonjour,');
        if (subjectUntouched) next.subject = generatedSubject;
        if (messageUntouched) next.message = generatedMessage;
      }
      return next;
    });
  }, [user, isSoldInquiry, soldName, soldSku, soldSlug, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');
    setSubmittedEmail('');
    setConfirmationEmailSent(false);

    const phone = formData.phone.trim();
    const bodyMessage = phone
      ? `${t.phoneLine(phone)}\n\n${formData.message.trim()}`
      : formData.message.trim();

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: clipSubject(formData.subject.trim()),
      message: bodyMessage,
    };

    try {
      const res = await apiFetch('/contact', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitStatus('error');
        setErrorMessage(getApiErrorMessage(res, data));
        return;
      }

      setSubmitStatus('success');
      setSubmittedEmail(data.data?.email || payload.email);
      setConfirmationEmailSent(Boolean(data.data?.confirmationEmailSent));
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setSubmitStatus('error');
      setErrorMessage(t.failedLater);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground">
      <Navigation />

      <main id="main-content" className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h1 className="font-serif text-4xl sm:text-5xl text-swisse-ink dark:text-foreground mb-4">
            {t.title}
          </h1>
          <p className="text-swisse-ink/70 dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isSoldInquiry && soldName ? t.soldInquiryBanner(soldName) : t.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-serif text-2xl text-swisse-ink dark:text-foreground mb-3">
              {t.getInTouch}
            </h2>
            <p className="flex items-start gap-2 text-sm text-swisse-ink/70 dark:text-muted-foreground mb-8">
              <Clock className="w-4 h-4 text-swisse-gold mt-0.5 shrink-0" />
              {t.responsePromise}
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    {t.email}
                  </h3>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-swisse-ink/70 dark:text-muted-foreground hover:text-swisse-gold dark:hover:text-primary transition-colors"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Instagram className="w-5 h-5 text-swisse-gold mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-1">
                    {t.instagram}
                  </h3>
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-swisse-ink/70 dark:text-muted-foreground hover:text-swisse-gold dark:hover:text-primary transition-colors"
                  >
                    {INSTAGRAM_HANDLE}
                  </a>
                  <p className="mt-1 text-sm text-swisse-ink/55 dark:text-muted-foreground">
                    {t.instagramHint}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-swisse-ink/80 dark:text-muted-foreground mb-3">
                  {t.topicsTitle}
                </h3>
                <ul className="space-y-2 text-sm text-swisse-ink/70 dark:text-muted-foreground">
                  {t.topics.map((topic) => (
                    <li key={topic} className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-swisse-gold" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-8 text-sm text-swisse-ink/55 dark:text-muted-foreground lg:hidden">
              {t.useFormMobile}
            </p>
            <p className="mt-8 text-sm text-swisse-ink/55 dark:text-muted-foreground hidden lg:block">
              {t.useForm}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border border-swisse-gold/20 dark:border-border bg-white/90 dark:bg-card shadow-sm p-6 sm:p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={labelClassName}>
                    {t.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClassName}>
                    {t.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={labelClassName}>
                  {t.phone}
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClassName}
                />
                <p className="mt-2 text-xs text-swisse-ink/50 dark:text-muted-foreground">{t.phoneHint}</p>
              </div>

              <div>
                <label htmlFor="subject" className={labelClassName}>
                  {t.subject}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="message" className={labelClassName}>
                  {t.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className={inputClassName}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || submitStatus === 'success'}
                className={`w-full py-3.5 px-6 text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  submitStatus === 'success'
                    ? 'bg-swisse-gold text-white'
                    : 'bg-swisse-ink hover:bg-swisse-gold disabled:opacity-50 text-swisse-canvas dark:bg-foreground dark:text-background dark:hover:bg-primary'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-swisse-canvas border-t-transparent rounded-full animate-spin dark:border-background" />
                    {t.sending}
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {t.messageSent}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t.sendMessage}
                  </>
                )}
              </button>

              {submitStatus === 'success' && submittedEmail && (
                <div className="p-4 bg-swisse-mist/80 dark:bg-muted/50 border border-swisse-gold/20 dark:border-border">
                  <p className="text-sm font-medium text-swisse-ink dark:text-foreground">
                    {t.thankYou}
                  </p>
                  <p className="text-sm text-swisse-ink/70 dark:text-muted-foreground mt-2">
                    {t.willContact(submittedEmail)}
                    {confirmationEmailSent && t.confirmationSent}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitStatus('idle');
                      setSubmittedEmail('');
                      setConfirmationEmailSent(false);
                      if (isSoldInquiry && soldName) {
                        const listingPath = soldSlug ? `/product/${soldSlug}` : '';
                        setFormData((prev) => ({
                          ...prev,
                          subject: clipSubject(t.soldInquirySubject(soldName, soldSku)),
                          message: t.soldInquiryMessage(soldName, soldSku, listingPath),
                        }));
                      }
                    }}
                    className="mt-3 text-sm font-medium text-swisse-gold hover:text-swisse-ink dark:text-primary dark:hover:text-foreground transition-colors"
                  >
                    {t.sendAnother}
                  </button>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {errorMessage || t.failedDefault}
                  </p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-swisse-canvas text-swisse-ink dark:bg-background dark:text-foreground">
          <Navigation />
          <main className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20" />
          <Footer />
        </div>
      }
    >
      <ContactPageInner />
    </Suspense>
  );
}
