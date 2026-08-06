'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Phone, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getReturnsTranslations } from '@/lib/i18n/returns';
import {
  bodyTextClass,
  cardClass,
  pageMainClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

const HIGHLIGHT_ICONS = [Phone, Package, CheckCircle, Mail] as const;

export default function ReturnsPage() {
  const { isFrench } = useLanguage();
  const t = getReturnsTranslations(isFrench);

  const highlights = t.highlights.map((item, index) => ({
    ...item,
    icon: HIGHLIGHT_ICONS[index],
  }));

  const deliverySteps = t.steps.map((step, index) => ({
    ...step,
    step: index + 1,
  }));

  return (
    <div className={pageShellClass}>
      <Navigation />

      <main id="main-content" className={pageMainClass}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h1 className={pageTitleClass}>{t.title}</h1>
          <p className={`${pageSubtitleClass} mx-auto max-w-3xl`}>{t.subtitle}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${cardClass} text-center`}
            >
              <item.icon className="mx-auto mb-4 h-12 w-12 text-swisse-gold" />
              <h3 className="mb-2 font-serif text-lg text-swisse-ink dark:text-foreground">
                {item.title}
              </h3>
              <p className={`${bodyTextClass} text-sm`}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className={`${sectionTitleClass} mb-8 text-center`}>{t.missRefuseHeading}</h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {deliverySteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className={`${cardClass} h-full`}>
                  <div className="mb-4 flex items-center">
                    <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-swisse-ink text-sm font-bold text-swisse-canvas dark:bg-foreground dark:text-background">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="mb-2 font-serif text-lg text-swisse-ink dark:text-foreground">
                    {step.title}
                  </h3>
                  <p className={`${bodyTextClass} mb-4`}>{step.description}</p>

                  <ul className="space-y-2">
                    {step.details.map((detail) => (
                      <li key={detail} className={`flex items-start text-sm ${bodyTextClass}`}>
                        <span className="mr-2 text-swisse-gold">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                {index < deliverySteps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 hidden h-0.5 w-8 -translate-y-1/2 transform bg-swisse-gold/20 dark:bg-border md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`${cardClass} mb-16 !border-swisse-gold/25 bg-swisse-mist/40 dark:bg-muted/30`}
        >
          <div className="flex items-start">
            <AlertCircle className="mt-1 mr-3 h-6 w-6 shrink-0 text-swisse-gold" />
            <div>
              <h3 className="mb-3 font-serif text-lg text-swisse-ink dark:text-foreground">
                {t.important}
              </h3>
              <p className={bodyTextClass}>
                {isFrench ? (
                  <>
                    Les pièces ne sont réservées qu’après confirmation téléphonique par le
                    support. La livraison est gratuite partout en Tunisie (environ 5–7 jours
                    après confirmation). Modifications, refus et problèmes de livraison sont
                    traités au cas par cas — écrivez à{' '}
                    <a
                      href="mailto:admin@swisia.store"
                      className="text-swisse-gold underline-offset-2 hover:underline"
                    >
                      admin@swisia.store
                    </a>{' '}
                    ou au numéro qui a confirmé votre commande. Nous ne publions pas de ligne
                    téléphonique publique pour les retours.
                  </>
                ) : (
                  <>
                    Pieces are reserved only after support confirms your order by phone. Shipping
                    is free across Tunisia (about 5–7 days after confirmation). Changes,
                    refusals, and delivery issues are handled case by case — email{' '}
                    <a
                      href="mailto:admin@swisia.store"
                      className="text-swisse-gold underline-offset-2 hover:underline"
                    >
                      admin@swisia.store
                    </a>{' '}
                    or the number that confirmed your order. We do not publish a public phone
                    line for returns.
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className={`${cardClass} bg-swisse-mist/40 dark:bg-muted/30`}
        >
          <h3 className={`${sectionTitleClass} mb-4`}>{t.needChange}</h3>
          <p className={`${bodyTextClass} mb-6`}>{t.needChangeBody}</p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-swisse-ink text-sm font-bold text-swisse-canvas dark:bg-foreground dark:text-background">
                1
              </div>
              <h4 className="mb-2 font-serif text-swisse-ink dark:text-foreground">
                {t.reachOut}
              </h4>
              <p className={`text-sm ${bodyTextClass}`}>{t.reachOutBody}</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-swisse-ink text-sm font-bold text-swisse-canvas dark:bg-foreground dark:text-background">
                2
              </div>
              <h4 className="mb-2 font-serif text-swisse-ink dark:text-foreground">
                {t.explainChange}
              </h4>
              <p className={`text-sm ${bodyTextClass}`}>{t.explainChangeBody}</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-swisse-ink text-sm font-bold text-swisse-canvas dark:bg-foreground dark:text-background">
                3
              </div>
              <h4 className="mb-2 font-serif text-swisse-ink dark:text-foreground">
                {t.confirmNext}
              </h4>
              <p className={`text-sm ${bodyTextClass}`}>{t.confirmNextBody}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <h3 className={`${sectionTitleClass} mb-4`}>{t.questionsDelivery}</h3>
          <p className={`${bodyTextClass} mb-6`}>
            {isFrench ? (
              <>
                Notre équipe est là pour vous aider — utilisez le formulaire de contact ou
                écrivez à{' '}
                <a
                  href="mailto:admin@swisia.store"
                  className="text-swisse-gold underline-offset-2 hover:underline"
                >
                  admin@swisia.store
                </a>
                .
              </>
            ) : (
              <>
                Our team is here to help — use the contact form or email{' '}
                <a
                  href="mailto:admin@swisia.store"
                  className="text-swisse-gold underline-offset-2 hover:underline"
                >
                  admin@swisia.store
                </a>
                .
              </>
            )}
          </p>

          <Link href="/contact" className={primaryButtonClass}>
            <ArrowLeft className="h-4 w-4" />
            {t.contactSupport}
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
