'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const categories = [
  {
    id: 'totes',
    name: 'Totes',
    description: 'Everyday tote bags — from canvas to leather',
    image: '👜',
    color: 'from-amber-400 to-orange-500',
    href: '/category/totes',
  },
  {
    id: 'handbags',
    name: 'Handbags',
    description: 'Top-handle and structured handbags',
    image: '👛',
    color: 'from-rose-400 to-pink-500',
    href: '/category/handbags',
  },
  {
    id: 'crossbody-bags',
    name: 'Crossbody bags',
    description: 'Hands-free bags with a crossbody strap',
    image: '🎒',
    color: 'from-violet-400 to-purple-500',
    href: '/category/crossbody-bags',
  },
  {
    id: 'clutches',
    name: 'Clutches',
    description: 'Evening and compact clutch bags',
    image: '✨',
    color: 'from-yellow-400 to-amber-500',
    href: '/category/clutches',
  },
  {
    id: 'travel-bags',
    name: 'Travel bags',
    description: 'Weekenders and travel-ready bags',
    image: '🧳',
    color: 'from-teal-400 to-cyan-500',
    href: '/category/travel-bags',
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Shop by Category
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
            Explore our bag collections — totes, handbags, crossbody bags, clutches, and travel bags.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="relative p-8">
                <div className="text-5xl mb-4">{category.image}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-600 dark:group-hover:from-white dark:group-hover:to-gray-300">
                  {category.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {category.description}
                </p>
                <div className="mt-4 flex items-center text-sm font-medium text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Shop now
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
