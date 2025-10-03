'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Truck, Clock, MapPin, Shield, Package } from 'lucide-react';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      duration: '3-5 business days',
      price: 'Free',
      description: 'Our standard shipping option for most orders',
      icon: Truck,
      features: ['Free on orders over $50', 'Tracking included', '3-5 business days']
    },
    {
      name: 'Express Shipping',
      duration: '1-2 business days',
      price: '$9.99',
      description: 'Fast delivery for when you need items quickly',
      icon: Clock,
      features: ['Next-day delivery available', 'Priority handling', '1-2 business days']
    },
    {
      name: 'Same-Day Delivery',
      duration: 'Same day',
      price: '$19.99',
      description: 'Available in select metropolitan areas',
      icon: MapPin,
      features: ['Limited areas', 'Order by 2 PM', 'Same-day delivery']
    }
  ];

  const shippingInfo = [
    {
      title: 'Processing Time',
      description: 'Orders are processed within 1-2 business days',
      icon: Clock
    },
    {
      title: 'Tracking',
      description: 'You\'ll receive tracking information via email',
      icon: Package
    },
    {
      title: 'Secure Packaging',
      description: 'All items are carefully packaged for safe delivery',
      icon: Shield
    },
    {
      title: 'Delivery Areas',
      description: 'We ship to all 50 US states',
      icon: MapPin
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Shipping Information
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Fast, reliable shipping options to get your fashion items delivered 
            quickly and safely to your doorstep.
          </p>
        </motion.div>

        {/* Shipping Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Shipping Options
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingOptions.map((option, index) => (
              <motion.div
                key={option.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center mb-6">
                  <option.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {option.name}
                  </h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {option.price}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mb-4">
                    {option.duration}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                
                <ul className="space-y-3">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-400">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Shipping Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            What to Expect
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingInfo.map((info, index) => (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <info.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {info.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* International Shipping */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 mb-16"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            International Shipping
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We currently ship to the United States only. We're working on expanding 
            our shipping options to other countries. Sign up for our newsletter to 
            be notified when international shipping becomes available.
          </p>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Coming Soon: International Shipping
            </h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              We're planning to offer shipping to Canada, UK, and EU countries in 2024. 
              Stay tuned for updates!
            </p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Shipping FAQ
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                How long does shipping take?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days. 
                Processing time is 1-2 business days before your order ships.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer free shipping?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! We offer free standard shipping on all orders over $50. 
                Orders under $50 have a $5.99 shipping fee.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I track my order?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Absolutely! You'll receive a tracking number via email once your order ships. 
                You can also track your order in your account dashboard.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What if my package is lost or damaged?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We're sorry to hear that! Please contact our customer service immediately. 
                We'll work with the shipping carrier to resolve the issue and ensure you receive 
                your items or a full refund.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

