'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
            Explore our diverse collection of fashion categories. From elegant dresses to stylish accessories, find everything you need to complete your perfect look.
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
              className="group block"
            >
              <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90`} />
                
                {/* Content */}
                <div className="relative p-8 h-64 flex flex-col justify-between">
                  <div className="text-center">
                    <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                      {category.image}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {category.description}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="flex justify-center">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transform group-hover:translate-x-1 transition-transform duration-300">
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
                    </div>
                  </div>
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

