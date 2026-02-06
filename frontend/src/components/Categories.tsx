'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const categories = [
  {
    id: 'women',
    name: 'Women',
    description: 'Elegant dresses, tops, and accessories',
    image: '👗',
    color: 'from-pink-400 to-rose-500',
    href: '/category/women',
  },
  {
    id: 'men',
    name: 'Men',
    description: 'Classic shirts, jackets, and casual wear',
    image: '👔',
    color: 'from-blue-400 to-indigo-500',
    href: '/category/men',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Bags, scarves, and fashion accessories',
    image: '👜',
    color: 'from-purple-400 to-violet-500',
    href: '/category/accessories',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    description: 'Shoes, boots, and sneakers',
    image: '👠',
    color: 'from-orange-400 to-red-500',
    href: '/category/footwear',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Necklaces, earrings, and watches',
    image: '💍',
    color: 'from-yellow-400 to-amber-500',
    href: '/category/jewelry',
  },
  {
    id: 'activewear',
    name: 'Activewear',
    description: 'Athletic wear and fitness clothing',
    image: '🏃‍♀️',
    color: 'from-green-400 to-emerald-500',
    href: '/category/activewear',
  },
];

const Categories = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore our diverse collection of fashion categories, each curated with unique pieces from talented designers
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={itemVariants}>
              <Link
                href={category.href}
                className="group block"
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  {/* Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  {/* Content */}
                  <div className="relative p-8 h-64 flex flex-col justify-between">
                    <div className="text-center">
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        className="text-6xl mb-4 transition-transform duration-300"
                      >
                        {category.image}
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {category.name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {category.description}
                      </p>
                    </div>
                    
                    {/* Arrow indicator */}
                    <div className="flex justify-center">
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-white/30"
                      >
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {[
            { number: '500+', label: 'Independent Designers' },
            { number: '10K+', label: 'Unique Products' },
            { number: '50K+', label: 'Happy Customers' },
            { number: '24/7', label: 'Customer Support' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{stat.number}</div>
              <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
