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
      description: 'Free shipping over 100 TND',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day hassle-free return policy',
    },
    {
      icon: CreditCard,
      title: 'Multiple Payment Options',
      description: 'Pay with credit card or other methods',
    },
  ];

  return (
    <section className="py-12 bg-gradient-to-b from-muted/80 to-background border-y border-border">
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
              className="flex flex-col items-center text-center p-6 rounded-lg hover:bg-card/80 transition-all duration-300"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="mb-4 p-3 rounded-full bg-primary/12 ring-1 ring-primary/25"
              >
                <indicator.icon className="w-8 h-8 text-primary" />
              </motion.div>
              <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                {indicator.title}
              </h3>
              <p className="text-sm text-muted-foreground">
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
