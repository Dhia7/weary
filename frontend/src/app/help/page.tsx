'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ChevronDown, Search, Mail, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import {
  bodyTextClass,
  cardClass,
  inputClass,
  pageMainClass,
  pageShellClass,
  pageSubtitleClass,
  pageTitleClass,
  primaryButtonClass,
  secondaryButtonClass,
  sectionTitleClass,
} from '@/lib/content-page-styles';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You can pay with cash on delivery for your convenience.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We currently accept cash on delivery (COD) for all orders. This ensures a secure and convenient shopping experience.'
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days. Express shipping options are available for faster delivery.'
    },
    {
      question: 'Can I return or exchange items?',
      answer: 'Yes! We offer a 30-day return policy for unused items with original tags. Exchanges are also available for different sizes.'
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you\&apos;ll receive a tracking number via email. You can also check your order status in your account dashboard.'
    },
    {
      question: 'What if I receive a damaged item?',
      answer: 'We\&apos;re sorry to hear that! Please contact our customer service immediately with photos of the damage, and we\&apos;ll arrange a replacement or refund.'
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within the United States. We\&apos;re working on expanding our shipping options to other countries.'
    },
    {
      question: 'How do I contact customer service?',
      answer: 'You can reach us via email at support@wear.com, call us at +1 (555) 123-4567, or use the contact form on our website.'
    }
  ];

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

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={pageShellClass}>
      <Navigation />

      <main id="main-content" className={pageMainClass}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className={pageTitleClass}>Help Center</h1>
          <p className={`${pageSubtitleClass} mb-8 max-w-2xl mx-auto`}>
            Find answers to your questions or get in touch with our support team
          </p>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-swisse-gold/70 w-5 h-5" />
            <label htmlFor="help-search" className="sr-only">
              Search help articles
            </label>
            <input
              id="help-search"
              type="search"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
        </motion.div>

        {/* Help Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
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

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className={`${sectionTitleClass} mb-8 text-center`}>
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-4xl mx-auto">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <p className={bodyTextClass}>
                  No results found for &ldquo;{searchQuery}&rdquo;. Try a different search term.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`${cardClass} overflow-hidden p-0`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-swisse-mist/50 dark:hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-medium text-swisse-ink dark:text-foreground">
                        {faq.question}
                      </span>
                      <ChevronDown 
                        className={`w-5 h-5 text-swisse-gold/70 transition-transform ${
                          openFaq === index ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>
                    
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-6 pb-4"
                      >
                        <p className={bodyTextClass}>
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`mt-16 ${cardClass} bg-swisse-mist/40 dark:bg-muted/30`}
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
      </main>

      <Footer />
    </div>
  );
}

