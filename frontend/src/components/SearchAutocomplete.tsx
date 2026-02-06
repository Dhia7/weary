'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ClockIcon, FireIcon, TagIcon } from '@heroicons/react/24/outline';
import { buildApiUrl } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string;
  price: number;
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface AutocompleteResults {
  products: Product[];
  categories: Category[];
  popularProducts: Product[];
}

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  className?: string;
  placeholder?: string;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchAutocomplete = ({ 
  onSearch, 
  className = '', 
  placeholder = 'Search for products...' 
}: SearchAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteResults | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const trimmed = searchTerm.trim();
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase())]
        .slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch autocomplete results
  const fetchAutocomplete = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const apiUrl = buildApiUrl('/products/autocomplete', { q: searchTerm });
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResults(data.data);
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        fetchAutocomplete(query);
      }, 300);
    } else {
      setResults(null);
      setIsOpen(recentSearches.length > 0);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, fetchAutocomplete, recentSearches.length]);

  // Handle search submission
  const handleSearch = useCallback((searchTerm?: string) => {
    const term = searchTerm || query.trim();
    if (!term) return;

    saveRecentSearch(term);
    setIsOpen(false);
    setQuery('');
    router.push(`/search?q=${encodeURIComponent(term)}`);
    if (onSearch) {
      onSearch(term);
    }
  }, [query, router, onSearch, saveRecentSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allItems: Array<{ type: string; index: number }> = [];
    
    if (recentSearches.length > 0 && !query.trim()) {
      recentSearches.forEach((_, i) => {
        allItems.push({ type: 'recent', index: i });
      });
    } else if (results) {
      results.categories.forEach((_, i) => {
        allItems.push({ type: 'category', index: i });
      });
      results.products.forEach((_, i) => {
        allItems.push({ type: 'product', index: i });
      });
      if (results.popularProducts.length > 0) {
        results.popularProducts.forEach((_, i) => {
          allItems.push({ type: 'popular', index: i });
        });
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item.type === 'recent') {
        handleSearch(recentSearches[item.index]);
      } else if (item.type === 'category' && results) {
        router.push(`/category/${results.categories[item.index].slug}`);
        setIsOpen(false);
      } else if (item.type === 'product' && results) {
        router.push(`/product/${results.products[item.index].slug}`);
        setIsOpen(false);
      } else if (item.type === 'popular' && results) {
        router.push(`/product/${results.popularProducts[item.index].slug}`);
        setIsOpen(false);
      }
    } else if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const totalItems = results
    ? results.categories.length + results.products.length + results.popularProducts.length
    : 0;

  return (
    <div className={`relative w-full ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative"
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() || recentSearches.length > 0) {
              setIsOpen(true);
            }
          }}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : !query.trim() && recentSearches.length > 0 ? (
            // Recent searches
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recent Searches
                  </span>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                    selectedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`}
                >
                  <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{search}</span>
                </button>
              ))}
            </div>
          ) : results && totalItems > 0 ? (
            <div className="p-2">
              {/* Categories */}
              {results.categories.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <TagIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Categories
                    </span>
                  </div>
                  {results.categories.map((category, index) => {
                    const itemIndex = index;
                    return (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        onClick={() => setIsOpen(false)}
                        className={`block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedIndex === itemIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {category.name}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Products */}
              {results.products.length > 0 && (
                <div className="mb-2">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Products
                    </span>
                  </div>
                  {results.products.map((product, index) => {
                    const itemIndex = results.categories.length + index;
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedIndex === itemIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        {product.imageUrl && (
                          <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <Image
                              src={getImageUrl(product.imageUrl) || ''}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Popular Products */}
              {results.popularProducts.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-2">
                    <FireIcon className="h-4 w-4 text-orange-400" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Popular Products
                    </span>
                  </div>
                  {results.popularProducts.map((product, index) => {
                    const itemIndex = results.categories.length + results.products.length + index;
                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          selectedIndex === itemIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        {product.imageUrl && (
                          <div className="relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <Image
                              src={getImageUrl(product.imageUrl) || ''}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
