'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const categories = [
  {
    id: 'women',
    name: 'Women',
    nameFr: 'Femmes',
    description: 'Elegant dresses, tops, and accessories',
    descriptionFr: 'Robes elegantes, hauts et accessoires',
    image: '👗',
    color: 'from-amber-800 via-amber-700 to-stone-900',
    href: '/category/women',
  },
  {
    id: 'men',
    name: 'Men',
    nameFr: 'Hommes',
    description: 'Classic shirts, jackets, and casual wear',
    descriptionFr: 'Chemises classiques, vestes et tenues decontractees',
    image: '👔',
    color: 'from-stone-700 via-neutral-800 to-stone-950',
    href: '/category/men',
  },
  {
    id: 'accessories',
    name: 'Accessories',
    nameFr: 'Accessoires',
    description: 'Bags, scarves, and fashion accessories',
    descriptionFr: 'Sacs, echarpes et accessoires de mode',
    image: '👜',
    color: 'from-yellow-700 via-amber-800 to-yellow-900',
    href: '/category/accessories',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    nameFr: 'Chaussures',
    description: 'Shoes, boots, and sneakers',
    descriptionFr: 'Souliers, bottes et baskets',
    image: '👠',
    color: 'from-amber-900 via-stone-800 to-neutral-950',
    href: '/category/footwear',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    nameFr: 'Bijoux',
    description: 'Necklaces, earrings, and watches',
    descriptionFr: 'Colliers, boucles d oreilles et montres',
    image: '💍',
    color: 'from-yellow-600 via-primary to-amber-900',
    href: '/category/jewelry',
  },
  {
    id: 'activewear',
    name: 'Activewear',
    nameFr: 'Sport',
    description: 'Athletic wear and fitness clothing',
    descriptionFr: 'Tenues sportives et vetements de fitness',
    image: '🏃‍♀️',
    color: 'from-stone-600 via-amber-900 to-stone-950',
    href: '/category/activewear',
  },
];

const Categories = () => {
  const { isFrench } = useLanguage();
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
    <section className="py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {isFrench ? 'Acheter par categorie' : 'Shop by Category'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isFrench
              ? 'Explorez nos categories de mode variees, chacune composee de pieces uniques signees par des createurs talentueux.'
              : 'Explore our diverse collection of fashion categories, each curated with unique pieces from talented designers'}
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
                        {isFrench ? category.nameFr : category.name}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {isFrench ? category.descriptionFr : category.description}
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
            {
              number: '500+',
              label: isFrench ? 'Createurs independants' : 'Independent Designers',
            },
            {
              number: '10K+',
              label: isFrench ? 'Produits uniques' : 'Unique Products',
            },
            {
              number: '50K+',
              label: isFrench ? 'Clients satisfaits' : 'Happy Customers',
            },
            {
              number: '24/7',
              label: isFrench ? 'Support client' : 'Customer Support',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="text-center p-6 rounded-lg bg-muted/60 hover:bg-muted transition-colors border border-border/60"
            >
              <div className="text-3xl font-display font-semibold text-primary mb-2">{stat.number}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;
