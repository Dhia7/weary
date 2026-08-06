'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProcessFaq from '@/components/ProcessFaq';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageCircle,
  Package,
  Truck,
  RefreshCw,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getHelpTranslations } from '@/lib/i18n/help';
import {
  bodyTextClass,
  cardClass,
  pageMainClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

const CATEGORY_ICONS = [Package, Truck, RefreshCw, User] as const;

export default function HelpPage() {
  const { isFrench } = useLanguage();
  const t = getHelpTranslations(isFrench);

  const helpCategories = t.categories.map((category, index) => ({
    ...category,
    icon: CATEGORY_ICONS[index],
  }));

  return (
    <div className={pageShellClass}>
      <Navigation />

      <main id="main-content">
        <div className={pageMainClass}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <h1 className={pageTitleClass}>{t.title}</h1>
            <p className={`${pageSubtitleClass} mx-auto max-w-2xl`}>{t.subtitle}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className={`${sectionTitleClass} mb-8 text-center`}>{t.browseByTopic}</h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {helpCategories.map((category, index) => {
                const Icon = category.icon;
                const content = (
                  <>
                    <Icon className="mb-4 h-8 w-8 text-swisse-gold" />
                    <h3 className="mb-3 font-serif text-lg text-swisse-ink dark:text-foreground">
                      {category.title}
                    </h3>
                    <ul className="space-y-2">
                      {category.topics.map((topic) => (
                        <li key={topic} className={`text-sm ${bodyTextClass}`}>
                          • {topic}
                        </li>
                      ))}
                    </ul>
                  </>
                );

                return (
                  <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`${cardClass} transition-colors hover:border-swisse-gold/40`}
                  >
                    {category.href ? (
                      <Link href={category.href} className="block h-full">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        <ProcessFaq />

        <div className="mx-auto max-w-swisse px-4 pb-20 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`${cardClass} bg-swisse-mist/40 dark:bg-muted/30`}
          >
            <div className="text-center">
              <h3 className={`${sectionTitleClass} mb-4`}>{t.stillNeedHelp}</h3>
              <p className={`${bodyTextClass} mb-6`}>
                {isFrench ? (
                  <>
                    Écrivez à{' '}
                    <a
                      href="mailto:admin@swisia.store"
                      className="text-swisse-gold underline-offset-2 hover:underline"
                    >
                      admin@swisia.store
                    </a>
                    , utilisez le formulaire de contact, ou joignez le numéro qui a confirmé
                    votre commande avec vous.
                  </>
                ) : (
                  <>
                    Email{' '}
                    <a
                      href="mailto:admin@swisia.store"
                      className="text-swisse-gold underline-offset-2 hover:underline"
                    >
                      admin@swisia.store
                    </a>
                    , use the contact form, or reach the phone number that confirmed your
                    order with you.
                  </>
                )}
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/contact" className={primaryButtonClass}>
                  <MessageCircle className="h-4 w-4" />
                  {t.contactUs}
                </Link>

                <a href="mailto:admin@swisia.store" className={secondaryButtonClass}>
                  <Mail className="h-4 w-4" />
                  {t.emailSupport}
                </a>

                <Link href="/returns" className={secondaryButtonClass}>
                  <RefreshCw className="h-4 w-4" />
                  {t.deliveryReturns}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
