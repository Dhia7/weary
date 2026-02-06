'use client';

import { motion } from 'framer-motion';
import { Shield, Truck, RotateCcw, CreditCard } from 'lucide-react';

const TrustIndicators = () => {
  const indicators = [
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'Your payment information is encrypted and secure',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day hassle-free return policy',
    },
    {
      icon: CreditCard,
      title: 'Multiple Payment Options',
      description: 'Pay with credit card, PayPal, or other methods',
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {indicators.map((indicator, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="mb-4 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"
              >
                <indicator.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {indicator.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {indicator.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustIndicators;
