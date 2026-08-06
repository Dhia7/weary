'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';
import { getPrivacyTranslations } from '@/lib/i18n/privacy';
import {
  bodyTextClass,
  inlineLinkClass,
  pageMainNarrowClass,
  pageShellClass,
  pageTitleClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

export default function PrivacyPage() {
  const { isFrench } = useLanguage();
  const t = getPrivacyTranslations(isFrench);
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

            <h2 className={`${sectionTitleClass} mb-4`}>{t.collectTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.collectIntro}</p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              {t.collectItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.useTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.useIntro}</p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              {t.useItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.googleTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>
              {isFrench ? (
                t.googleBody
              ) : (
                <>
                  If you choose Sign in with Google, Google may share with Swisia the data you
                  authorize through the OAuth consent screen for our app (typically your Google
                  account subject identifier, name, email address, and profile picture, consistent
                  with the <strong>openid</strong>, <strong>email</strong>, and{' '}
                  <strong>profile</strong> scopes). We use that information only to create or log
                  you into your Swisia account, secure your session, and personalize your
                  experience on our site. Google processes your information under Google&apos;s own
                  policies; see Google&apos;s Privacy Policy for details on how Google handles your
                  data.
                </>
              )}
            </p>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.emailTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.emailBody}</p>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.sharingTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.sharingIntro}</p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              {t.sharingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.securityTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.securityBody}</p>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.cookiesTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.cookiesBody}</p>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.rightsTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.rightsIntro}</p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              {t.rightsItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.childrenTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.childrenBody}</p>

            <h2 className={`${sectionTitleClass} mb-4`}>{t.changesTitle}</h2>
            <p className={`${bodyTextClass} mb-6`}>{t.changesBody}</p>

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
