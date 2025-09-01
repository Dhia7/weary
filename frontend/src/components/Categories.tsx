'use client';

import Link from 'next/link';

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
  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore our diverse collection of fashion categories, each curated with unique pieces from talented designers
          </p>
        </div>

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

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">500+</div>
            <div className="text-gray-600 dark:text-gray-400">Independent Designers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">10K+</div>
            <div className="text-gray-600 dark:text-gray-400">Unique Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">50K+</div>
            <div className="text-gray-600 dark:text-gray-400">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-400">Customer Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
