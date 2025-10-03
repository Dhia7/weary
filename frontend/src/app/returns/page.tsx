'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  const returnSteps = [
    {
      step: 1,
      title: 'Check Eligibility',
      description: 'Ensure your item meets our return criteria',
      icon: CheckCircle,
      details: [
        'Item must be unused and in original condition',
        'Original tags and packaging must be intact',
        'Return request must be within 30 days of delivery',
        'Items must not be on final sale'
      ]
    },
    {
      step: 2,
      title: 'Initiate Return',
      description: 'Start your return process online',
      icon: Package,
      details: [
        'Log into your account and go to order history',
        'Select the item(s) you want to return',
        'Choose your reason for return',
        'Print the prepaid return label'
      ]
    },
    {
      step: 3,
      title: 'Package & Ship',
      description: 'Pack your items securely',
      icon: Package,
      details: [
        'Use the original packaging if possible',
        'Include the return form and receipt',
        'Attach the prepaid return label',
        'Drop off at any authorized shipping location'
      ]
    },
    {
      step: 4,
      title: 'Receive Refund',
      description: 'Get your money back quickly',
      icon: Clock,
      details: [
        'We\'ll process your return within 3-5 business days',
        'Refund will be issued to your original payment method',
        'You\'ll receive email confirmation of your refund',
        'Refunds typically appear in 5-10 business days'
      ]
    }
  ];

  const returnPolicy = [
    {
      title: '30-Day Return Window',
      description: 'You have 30 days from the delivery date to initiate a return.',
      icon: Clock
    },
    {
      title: 'Original Condition Required',
      description: 'Items must be unused, unworn, and in original packaging with tags attached.',
      icon: CheckCircle
    },
    {
      title: 'Free Return Shipping',
      description: 'We provide prepaid return labels for your convenience.',
      icon: Package
    },
    {
      title: 'Full Refund Guarantee',
      description: 'Receive a full refund to your original payment method.',
      icon: CheckCircle
    }
  ];

  const nonReturnableItems = [
    'Items worn or used',
    'Items without original tags',
    'Items damaged by customer',
    'Final sale items',
    'Custom or personalized items',
    'Items returned after 30 days'
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
            Returns & Exchanges
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We want you to love what you buy. If you're not completely satisfied, 
            we make returns easy and hassle-free.
          </p>
        </motion.div>

        {/* Return Policy Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {returnPolicy.map((policy, index) => (
            <motion.div
              key={policy.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center"
            >
              <policy.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {policy.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {policy.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* How to Return */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            How to Return an Item
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {returnSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {step.step}
                    </div>
                    <step.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {step.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Connector line */}
                {index < returnSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-y-1/2"></div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Non-Returnable Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16"
        >
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">
                  Items That Cannot Be Returned
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nonReturnableItems.map((item, index) => (
                    <div key={index} className="flex items-center text-red-800 dark:text-red-300">
                      <span className="text-red-600 mr-2">•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Exchange Process */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Need a Different Size or Color?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We offer easy exchanges for different sizes or colors. Simply follow the return process 
            and specify that you'd like an exchange instead of a refund.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Start Exchange</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Initiate return and select "Exchange" option
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Choose New Item</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select the size or color you'd prefer
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Receive New Item</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We'll ship your new item once we receive the return
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-16 text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Questions About Returns?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our customer service team is here to help with any return-related questions.
          </p>
          
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Contact Support
          </a>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

