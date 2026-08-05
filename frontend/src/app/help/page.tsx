'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProcessFaq from '@/components/ProcessFaq';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle } from 'lucide-react';
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
      icon: '🛒',
      topics: ['How to place an order', 'Payment methods', 'Order confirmation', 'Order modifications']
    },
    {
      title: 'Shipping & Delivery',
      icon: '🚚',
      topics: ['Shipping options', 'Delivery times', 'Tracking orders', 'International shipping']
    },
    {
      title: 'Returns & Exchanges',
      icon: '↩️',
      topics: ['Return policy', 'Exchange process', 'Refund timeline', 'Return shipping']
    },
    {
      title: 'Account & Profile',
      icon: '👤',
      topics: ['Creating account', 'Profile settings', 'Order history', 'Wishlist management']
    }
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
            className="text-center mb-12"
          >
            <h1 className={pageTitleClass}>Help Center</h1>
            <p className={`${pageSubtitleClass} max-w-2xl mx-auto`}>
              Find answers to your questions or get in touch with our support team
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className={`${sectionTitleClass} mb-8 text-center`}>
              Browse by Category
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`${cardClass} hover:border-swisse-gold/40 transition-colors`}
                >
                  <div className="text-3xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-serif text-swisse-ink dark:text-foreground mb-3">
                    {category.title}
                  </h3>
                  <ul className="space-y-2">
                    {category.topics.map((topic, topicIndex) => (
                      <li key={topicIndex} className={`text-sm ${bodyTextClass}`}>
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <ProcessFaq />

        <div className="max-w-swisse mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={`${cardClass} bg-swisse-mist/40 dark:bg-muted/30`}
          >
            <div className="text-center">
              <h3 className={`${sectionTitleClass} mb-4`}>
                Still need help?
              </h3>
              <p className={`${bodyTextClass} mb-6`}>
                Our support team is here to help you with any questions or concerns.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className={primaryButtonClass}>
                  <MessageCircle className="w-4 h-4" />
                  Contact Us
                </Link>

                <a href="mailto:support@wear.com" className={secondaryButtonClass}>
                  <Mail className="w-4 h-4" />
                  Email Support
                </a>

                <a href="tel:+15551234567" className={secondaryButtonClass}>
                  <Phone className="w-4 h-4" />
                  Call Us
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
