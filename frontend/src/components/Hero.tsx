'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Hero = () => {
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Background Image */}
      <motion.div
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        <Image
          src="/hero-image.jpg"
          alt="Latest Collections"
          fill
          className="object-cover"
          priority
        />
      </motion.div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left max-w-3xl"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl drop-shadow-lg"
            >
              <span className="block">Discover Your</span>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="block text-indigo-300 bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent"
              >
                Unique Style
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-3 text-base text-white/90 sm:mt-5 sm:text-lg md:mt-5 md:text-xl drop-shadow-lg max-w-2xl"
            >
              Elevate your wardrobe with premium fashion and accessories. Shop the latest collections and enjoy fast, reliable shipping on all orders.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-8 sm:flex sm:justify-center lg:justify-start gap-3 flex-wrap"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/products"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Shop Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/categories"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl mt-3 sm:mt-0"
                >
                  Shop Categories
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/designer"
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border-2 border-indigo-300 text-base font-medium rounded-md text-white bg-indigo-500/80 hover:bg-indigo-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 shadow-lg hover:shadow-xl mt-3 sm:mt-0"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Design Your T-Shirt
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.button
        onClick={scrollToContent}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 text-white hover:text-indigo-300 transition-colors"
        aria-label="Scroll down"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDownIcon className="w-8 h-8" />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default Hero;
