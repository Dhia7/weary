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

export default function HelpPage() {
  const helpCategories = [
    {
      title: 'Ordering & Payment',
      icon: Package,
      topics: [
        'Choose a collection and order on the site',
        'Support calls to confirm details',
        'Pay on delivery — cash or bank check',
        'Piece reserved only after confirmation',
      ],
    },
    {
      title: 'Shipping & Delivery',
      icon: Truck,
      topics: [
        'Free shipping across Tunisia',
        'About 5–7 days after confirmation',
        'Prepared in Geneva, customs included',
        'Price you see is what you pay (TND)',
      ],
    },
    {
      title: 'Delivery Issues',
      icon: RefreshCw,
      topics: [
        'Missed or refused delivery',
        'Rearrange with support',
        'Email admin@swisia.store',
        'Or the number that confirmed your order',
      ],
      href: '/returns',
    },
    {
      title: 'Account & Orders',
      icon: User,
      topics: [
        'We recommend creating an account',
        'Follow your orders in one place',
        'Save your order ID after checkout',
        'Contact support for changes',
      ],
    },
  ];

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
            <h1 className={pageTitleClass}>Help Center</h1>
            <p className={`${pageSubtitleClass} mx-auto max-w-2xl`}>
              How Swisia orders work — from choosing a collection to payment on
              delivery — and how to reach support when you need us.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className={`${sectionTitleClass} mb-8 text-center`}>
              Browse by topic
            </h2>

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
              <h3 className={`${sectionTitleClass} mb-4`}>Still need help?</h3>
              <p className={`${bodyTextClass} mb-6`}>
                Email{' '}
                <a
                  href="mailto:admin@swisia.store"
                  className="text-swisse-gold underline-offset-2 hover:underline"
                >
                  admin@swisia.store
                </a>
                , use the contact form, or reach the phone number that confirmed
                your order with you.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/contact" className={primaryButtonClass}>
                  <MessageCircle className="h-4 w-4" />
                  Contact Us
                </Link>

                <a href="mailto:admin@swisia.store" className={secondaryButtonClass}>
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>

                <Link href="/returns" className={secondaryButtonClass}>
                  <RefreshCw className="h-4 w-4" />
                  Delivery & Returns
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
