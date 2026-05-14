'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const NewsletterSignup = () => {
  const { isFrench } = useLanguage();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail('');

    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <section className="py-24 md:py-32 bg-swisse-canvas dark:bg-background border-t border-swisse-gold/10 dark:border-border">
      <div className="max-w-3xl mx-auto px-6 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-serif text-3xl md:text-4xl mb-6 text-swisse-ink dark:text-foreground">
            {isFrench ? 'Le cercle Swisse' : 'The Swissé Circle'}
          </h2>
          <p className="text-swisse-ink/70 dark:text-muted-foreground mb-12 leading-relaxed">
            {isFrench
              ? 'Inscrivez-vous a notre liste privee pour un acces anticipe aux collections limitees et des invitations a nos presentations regionales.'
              : 'Join our private mailing list for early access to limited collections and invitations to regional trunk shows.'}
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-end"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {isFrench ? 'Adresse e-mail' : 'Email address'}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isFrench ? 'Votre adresse e-mail' : 'Your email address'}
              autoComplete="email"
              required
              className="flex-1 bg-transparent border-b border-swisse-gold/30 dark:border-border py-4 px-2 outline-none focus:border-swisse-gold dark:focus:border-primary text-swisse-ink dark:text-foreground placeholder:text-swisse-ink/40 dark:placeholder:text-muted-foreground transition-colors text-left"
            />
            <button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className="px-10 md:px-12 py-4 bg-swisse-ink text-swisse-canvas text-[10px] font-bold uppercase tracking-widest hover:bg-swisse-gold transition-colors disabled:opacity-50 dark:bg-foreground dark:text-background dark:hover:bg-primary shrink-0"
            >
              {isSubmitting
                ? isFrench
                  ? 'Inscription...'
                  : 'Subscribing...'
                : isSuccess
                  ? isFrench
                    ? 'Inscrit'
                    : 'Subscribed'
                  : isFrench
                    ? 'S inscrire'
                    : 'Subscribe'}
            </button>
          </form>

          {isSuccess && (
            <p className="mt-6 text-sm text-swisse-gold dark:text-primary">
              {isFrench ? 'Merci, vous etes bien inscrit.' : "Thank you — you're on the list."}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
