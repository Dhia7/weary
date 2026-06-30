'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  bodyTextClass,
  inlineLinkClass,
  pageMainNarrowClass,
  pageShellClass,
  pageTitleClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

export default function TermsPage() {
  return (
    <div className={pageShellClass}>
      <Navigation />

      <main id="main-content" className={pageMainNarrowClass}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`${pageTitleClass} mb-8`}>Terms of Service</h1>

          <div className="max-w-none">
            <p className={`${bodyTextClass} mb-8`}>
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              1. Acceptance of Terms
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              By accessing and using this website, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please 
              do not use this service.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              2. Use License
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              Permission is granted to temporarily download one copy of the materials on
              Swisia&apos;s website for personal, non-commercial transitory viewing only. This is
              the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to reverse engineer any software contained on the website</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              3. Privacy Policy
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              Your privacy is important to us. Please review our Privacy Policy, which also 
              governs your use of the website, to understand our practices.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              4. User Accounts
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              When you create an account with us, you must provide information that is accurate, 
              complete, and current at all times. You are responsible for safeguarding the password 
              and for all activities that occur under your account.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              5. Prohibited Uses
            </h2>
            <p className={`${bodyTextClass} mb-4`}>
              You may not use our website:
            </p>
            <ul className={`list-disc pl-6 ${bodyTextClass} mb-6`}>
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
            </ul>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              6. Content
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              Our website allows you to post, link, store, share and otherwise make available 
              certain information, text, graphics, videos, or other material. You are responsible 
              for the content that you post to the website, including its legality, reliability, 
              and appropriateness.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              7. Disclaimer
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              The information on this website is provided on an &ldquo;as is&rdquo; basis. To the fullest 
              extent permitted by law, Swisia excludes all representations, warranties, 
              conditions and terms relating to our website and the use of this website.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              8. Governing Law
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              These terms and conditions are governed by and construed in accordance with the 
              laws of the United States and you irrevocably submit to the exclusive jurisdiction 
              of the courts in that state or location.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              9. Changes to Terms
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              We reserve the right, at our sole discretion, to modify or replace these Terms 
              at any time. If a revision is material, we will try to provide at least 30 days 
              notice prior to any new terms taking effect.
            </p>
            
            <h2 className={`${sectionTitleClass} mb-4`}>
              10. Contact Information
            </h2>
            <p className={`${bodyTextClass} mb-6`}>
              If you have any questions about these Terms of Service, please use our{' '}
              <Link href="/contact" className={inlineLinkClass}>
                Contact
              </Link>{' '}
              page.
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}


