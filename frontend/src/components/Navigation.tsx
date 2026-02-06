'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBagIcon, UserIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';
import CartPanel from './CartPanel';
import SearchAutocomplete from './SearchAutocomplete';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCart } from '@/lib/contexts/CartContext';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false);
  const { user, logout } = useAuth();
  const { totalQuantity } = useCart();

  const categories = [
    { name: 'Women', href: '/category/women' },
    { name: 'Men', href: '/category/men' },
    { name: 'Accessories', href: '/category/accessories' },
    { name: 'Footwear', href: '/category/footwear' },
    { name: 'Jewelry', href: '/category/jewelry' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">StyleHub</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <SearchAutocomplete placeholder="Search for products..." />
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart */}
            <button 
              onClick={() => setIsCartPanelOpen(true)}
              className="relative p-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              <ShoppingBagIcon className="h-6 w-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative group">
                <Link href="/account" className="p-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors">
                  <UserIcon className="h-6 w-6" />
                </Link>
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  {user.isAdmin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    My Account
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="p-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors">
                <UserIcon className="h-6 w-6" />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <SearchAutocomplete placeholder="Search for products..." />
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))}
            
            {/* Mobile Authentication */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              {user ? (
                <>
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                    <p>{user.email}</p>
                  </div>
                  <Link
                    href="/account"
                    className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 block px-3 py-2 text-base font-medium transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 block px-3 py-2 text-base font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Panel */}
      <CartPanel 
        isOpen={isCartPanelOpen} 
        onClose={() => setIsCartPanelOpen(false)} 
      />
    </nav>
  );
};

export default Navigation;
