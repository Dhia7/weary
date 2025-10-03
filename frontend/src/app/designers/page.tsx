'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Search, Star, Users, Award } from 'lucide-react';

interface Designer {
  id: number;
  name: string;
  slug: string;
  bio: string;
  image: string;
  rating: number;
  productCount: number;
  isFeatured: boolean;
}

export default function DesignersPage() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFeatured, setFilterFeatured] = useState(false);

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        setLoading(true);
        // For now, we'll use mock data since we don't have a designers API yet
        const mockDesigners: Designer[] = [
          {
            id: 1,
            name: 'Sarah Chen',
            slug: 'sarah-chen',
            bio: 'Contemporary fashion designer known for sustainable and minimalist designs.',
            image: '/uploads/designer-1.jpg',
            rating: 4.9,
            productCount: 45,
            isFeatured: true
          },
          {
            id: 2,
            name: 'Marcus Johnson',
            slug: 'marcus-johnson',
            bio: 'Streetwear innovator bringing urban culture to high fashion.',
            image: '/uploads/designer-2.jpg',
            rating: 4.8,
            productCount: 32,
            isFeatured: true
          },
          {
            id: 3,
            name: 'Elena Rodriguez',
            slug: 'elena-rodriguez',
            bio: 'Luxury evening wear specialist with a focus on sustainable materials.',
            image: '/uploads/designer-3.jpg',
            rating: 4.9,
            productCount: 28,
            isFeatured: false
          },
          {
            id: 4,
            name: 'David Kim',
            slug: 'david-kim',
            bio: 'Modern menswear designer creating timeless pieces for the contemporary man.',
            image: '/uploads/designer-4.jpg',
            rating: 4.7,
            productCount: 38,
            isFeatured: false
          }
        ];
        
        setDesigners(mockDesigners);
      } catch (error) {
        console.error('Error fetching designers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDesigners();
  }, []);

  const filteredDesigners = designers.filter(designer => {
    const matchesSearch = designer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         designer.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFeatured = !filterFeatured || designer.isFeatured;
    return matchesSearch && matchesFeatured;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

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
            Our Designers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Discover the talented designers behind our curated collection. 
            Each designer brings their unique vision and expertise to create 
            pieces that inspire and delight.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search designers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Featured only</span>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Designers Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filteredDesigners.map((designer, index) => (
            <motion.div
              key={designer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <div className="text-6xl">👨‍🎨</div>
                </div>
                {designer.isFeatured && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {designer.name}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {designer.bio}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span>{designer.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{designer.productCount} products</span>
                  </div>
                </div>
                
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  View Collection
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredDesigners.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No designers found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search criteria or filters.
            </p>
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center"
        >
          <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Are You a Designer?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            We&apos;re always looking for talented designers to join our platform. 
            If you&apos;re interested in showcasing your work, we&apos;d love to hear from you.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get in Touch
          </a>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

