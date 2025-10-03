'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Heart, Users, Award, Target, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Fashion',
      description: 'We believe fashion is a form of self-expression and we&apos;re passionate about helping you find pieces that make you feel confident and beautiful.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'We&apos;re building a community of fashion lovers who support each other and celebrate individual style.'
    },
    {
      icon: Award,
      title: 'Quality Assured',
      description: 'Every piece in our collection is carefully curated for quality, style, and sustainability.'
    },
    {
      icon: Target,
      title: 'Inclusive Design',
      description: 'Fashion should be accessible to everyone. We design for all body types, sizes, and personal styles.'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Happy Customers' },
    { number: '50+', label: 'Designers' },
    { number: '1000+', label: 'Products' },
    { number: '4.9', label: 'Average Rating' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              About Wear
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              We&apos;re more than just a fashion brand. We&apos;re a movement towards sustainable, 
              inclusive, and beautiful fashion that empowers everyone to express their unique style.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.number}</div>
                <div className="text-blue-100">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Our Story
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Founded in 2020, Wear began as a small team&apos;s dream to make fashion 
                more accessible, sustainable, and inclusive. We started with a simple 
                mission: to create beautiful clothing that makes people feel confident 
                while respecting our planet.
              </p>
              <p>
                Today, we&apos;ve grown into a community of fashion lovers who believe that 
                style should be personal, sustainable, and accessible to everyone. We work 
                with talented designers and ethical manufacturers to bring you pieces that 
                you&apos;ll love for years to come.
              </p>
              <p>
                Every piece in our collection is carefully curated for quality, style, 
                and sustainability. We believe in slow fashion - creating timeless pieces 
                that transcend trends and seasons.
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-200 dark:bg-gray-700 rounded-lg h-96 flex items-center justify-center"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">👗</div>
              <p>Our team at work</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              The principles that guide everything we do
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto mb-8">
            To democratize fashion by making beautiful, sustainable, and inclusive 
            clothing accessible to everyone, while building a community that celebrates 
            individual style and positive change.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Sustainable
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Eco-friendly materials and ethical manufacturing
              </p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Inclusive
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fashion for all body types, sizes, and styles
              </p>
            </div>
            
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Quality
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Timeless pieces designed to last
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

