'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  FireIcon,
  TagIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useProductAutocomplete } from '@/lib/hooks/useProductAutocomplete';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface SearchAutocompleteProps {
  onSearch?: (query: string) => void;
  className?: string;
  placeholder?: string;
}

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

const CATEGORY_OPTIONS = [
  { slug: '', label: 'Shop', labelFr: 'Boutique' },
  { slug: 'women', label: 'Women', labelFr: 'Femmes' },
  { slug: 'men', label: 'Men', labelFr: 'Hommes' },
  { slug: 'accessories', label: 'Accessories', labelFr: 'Accessoires' },
  { slug: 'footwear', label: 'Footwear', labelFr: 'Chaussures' },
  { slug: 'jewelry', label: 'Jewelry', labelFr: 'Bijoux' },
] as const;

const SearchAutocomplete = ({ 
  onSearch, 
  className = '', 
  placeholder = 'Search for products...' 
}: SearchAutocompleteProps) => {
  const { isFrench } = useLanguage();
  const fieldId = useId();
  const searchInputId = `${fieldId}-search`;
  const categoryMenuId = `${fieldId}-category-menu`;
  const resolvedPlaceholder =
    placeholder === 'Search for products...' && isFrench ? 'Rechercher des produits...' : placeholder;
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySlug, setCategorySlug] = useState<string>('');
  const { results, loading } = useProductAutocomplete(debouncedQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Debounce query for SWR autocomplete
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(query.trim());
      }, 300);
    } else {
      setDebouncedQuery('');
      setIsOpen(recentSearches.length > 0);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, recentSearches.length]);

  useEffect(() => {
    if (debouncedQuery && results) {
      setIsOpen(true);
    }
  }, [debouncedQuery, results]);

  // Handle search submission
  const handleSearch = useCallback((searchTerm?: string) => {
    const term = searchTerm || query.trim();
    if (!term) return;

    saveRecentSearch(term);
    setIsOpen(false);
    setIsCategoryOpen(false);
    setQuery('');
    const url =
      categorySlug && categorySlug.trim().length > 0
        ? `/search?q=${encodeURIComponent(term)}&category=${encodeURIComponent(categorySlug)}`
        : `/search?q=${encodeURIComponent(term)}`;
    router.push(url);
    if (onSearch) {
      onSearch(term);
    }
  }, [query, router, onSearch, saveRecentSearch, categorySlug]);

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
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsCategoryOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const formatPrice = (price: number) => `${Number(price).toFixed(2)} TND`;

  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const totalItems = results
    ? results.categories.length + results.products.length + results.popularProducts.length
    : 0;

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.slug === categorySlug) ?? CATEGORY_OPTIONS[0];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="relative"
      >
        <div className="relative flex w-full border border-swisse-gold/25 dark:border-input rounded-sm leading-5 bg-swisse-canvas/80 dark:bg-card overflow-visible">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((v) => !v)}
              className="h-full inline-flex items-center gap-1.5 px-3 text-[11px] font-bold uppercase tracking-widest text-swisse-ink/80 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary border-r border-swisse-gold/20 dark:border-border"
              aria-haspopup="menu"
              aria-controls={categoryMenuId}
              aria-expanded={isCategoryOpen}
              aria-label={
                isFrench
                  ? `Filtrer par categorie : ${selectedCategory.labelFr}`
                  : `Filter by category: ${selectedCategory.label}`
              }
            >
              <span className="whitespace-nowrap">
                {isFrench ? selectedCategory.labelFr : selectedCategory.label}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isCategoryOpen && (
              <div
                id={categoryMenuId}
                className="absolute left-0 top-full mt-2 w-52 rounded-md border border-swisse-gold/15 bg-swisse-canvas dark:bg-popover dark:border-border shadow-lg py-1 z-50"
                role="menu"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.slug || 'all'}
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-swisse-mist dark:hover:bg-muted ${
                      opt.slug === categorySlug
                        ? 'text-swisse-gold dark:text-primary'
                        : 'text-swisse-ink dark:text-popover-foreground'
                    }`}
                    onClick={() => {
                      setCategorySlug(opt.slug);
                      setIsCategoryOpen(false);
                      setIsOpen(false);

                      // Behave like the old "Shop" dropdown: choosing a category navigates immediately.
                      if (!opt.slug) {
                        router.push('/products');
                      } else {
                        router.push(`/category/${opt.slug}`);
                      }
                    }}
                    role="menuitem"
                  >
                    {isFrench ? opt.labelFr : opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <label htmlFor={searchInputId} className="sr-only">
              {isFrench ? 'Rechercher des produits' : 'Search products'}
            </label>
            <input
              ref={inputRef}
              id={searchInputId}
              type="search"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={isOpen ? `${fieldId}-results` : undefined}
              placeholder={resolvedPlaceholder}
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
              className="block w-full pl-10 pr-3 py-2 bg-transparent text-swisse-ink dark:text-foreground placeholder-swisse-ink/45 dark:placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-inset focus:ring-swisse-gold/50 dark:focus:ring-primary/40"
            />
          </div>
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          id={`${fieldId}-results`}
          className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {isFrench ? 'Recherche...' : 'Searching...'}
            </div>
          ) : !query.trim() && recentSearches.length > 0 ? (
            // Recent searches
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isFrench ? 'Recherches recentes' : 'Recent Searches'}
                  </span>
                </div>
                {recentSearches.length > 0 && (
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {isFrench ? 'Effacer' : 'Clear'}
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
                      {isFrench ? 'Categories' : 'Categories'}
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
                      {isFrench ? 'Produits' : 'Products'}
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
                      {isFrench ? 'Produits populaires' : 'Popular Products'}
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
              {isFrench
                ? `Aucun resultat pour "${query}"`
                : `No results found for "${query}"`}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
