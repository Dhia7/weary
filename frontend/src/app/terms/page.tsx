'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getTermsTranslations } from '@/lib/i18n/terms';
import {
  bodyTextClass,
  inlineLinkClass,
  pageMainNarrowClass,
  pageShellClass,
  pageTitleClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

export default function TermsPage() {
  const { isFrench } = useLanguage();
  const t = getTermsTranslations(isFrench);
  const lastUpdated = new Date().toLocaleDateString(isFrench ? 'fr-FR' : 'en-US');

  return (
    <div className={pageShellClass}>
      <Navigation />

      <main id="main-content" className={pageMainNarrowClass}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`${pageTitleClass} mb-8`}>{t.title}</h1>

          <div className="max-w-none">
            <p className={`${bodyTextClass} mb-8`}>
              {t.lastUpdated} {lastUpdated}
            </p>

            {t.sections.map((section) => (
              <div key={section.title}>
                <h2 className={`${sectionTitleClass} mb-4`}>{section.title}</h2>
                <p
                  className={`${bodyTextClass} ${
                    'items' in section && section.items ? 'mb-4' : 'mb-6'
                  }`}
                >
                  {section.body}
                </p>
                {'items' in section && section.items && (
                  <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <h2 className={`${sectionTitleClass} mb-4`}>{t.contactTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>
              {t.contactBefore}
              <Link href="/contact" className={inlineLinkClass}>
                {t.contactLink}
              </Link>
              {t.contactAfter}
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
