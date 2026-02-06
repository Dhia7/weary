'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail('');
    
    // Reset success message after 3 seconds
    setTimeout(() => setIsSuccess(false), 3000);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-4"
          >
            <Mail className="w-12 h-12 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-lg text-indigo-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and be the first to know about new collections, exclusive deals, and fashion tips.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            />
            <motion.button
              type="submit"
              disabled={isSubmitting || isSuccess}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? 'Subscribing...' : isSuccess ? 'Subscribed!' : 'Subscribe'}
            </motion.button>
          </motion.form>

          {isSuccess && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-white text-sm"
            >
              Thank you for subscribing! Check your email for confirmation.
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
