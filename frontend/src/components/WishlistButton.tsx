'use client';

import { useEffect, useState } from 'react';
import { useWishlist } from '@/lib/contexts/WishlistContext';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
  onToggle?: (isInWishlist: boolean) => void;
}

export default function WishlistButton({
  productId,
  size = 'md',
  variant = 'default',
  className = '',
  showText = false,
  onToggle
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user, token } = useAuth();
  const isAuthenticated = !!(user && token);
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [optimisticInWishlist, setOptimisticInWishlist] = useState<boolean>(false);
  const { showWishlistAdded } = useOrderNotification();

  const isProductInWishlist = isInWishlist(productId);

  // Keep local optimistic state in sync with actual state
  useEffect(() => {
    setOptimisticInWishlist(isProductInWishlist);
  }, [isProductInWishlist]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const variantClasses = {
    default: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-900/20',
    outline: 'border-2 border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 bg-white dark:bg-gray-800',
    ghost: 'bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20'
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }

    setIsLoading(true);
    try {
      // Optimistic toggle
      const next = !optimisticInWishlist;
      setOptimisticInWishlist(next);

      if (isProductInWishlist) {
        const ok = await removeFromWishlist(productId);
        if (!ok) {
          // revert on failure
          setOptimisticInWishlist(!next);
        } else {
          onToggle?.(false);
        }
      } else {
        const ok = await addToWishlist(productId);
        if (!ok) {
          setOptimisticInWishlist(!next);
        } else {
          onToggle?.(true);
          // Show wishlist added notification (no product name available here)
          showWishlistAdded();
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // revert on unexpected error
      setOptimisticInWishlist(isProductInWishlist);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
          rounded-full flex items-center justify-center transition-all duration-200
          hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
          shadow-sm hover:shadow-md
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(false)}
      >
        {isLoading ? (
          <div className={`${iconSizes[size]} border-2 border-red-500 border-t-transparent rounded-full animate-spin`} />
        ) : (
          <Heart 
            className={`${iconSizes[size]} transition-colors ${
              optimisticInWishlist 
                ? 'fill-red-500 text-red-500 stroke-red-500' 
                : 'text-gray-600 dark:text-gray-400 stroke-gray-600 dark:stroke-gray-400 hover:text-red-500 hover:stroke-red-500'
            }`} 
          />
        )}
        {showText && (
          <span className="ml-2 text-sm font-medium">
            {optimisticInWishlist ? 'Saved' : 'Save'}
          </span>
        )}
      </motion.button>

      {/* Tooltip for non-authenticated users */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-md whitespace-nowrap z-50"
        >
          Please log in to save items
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </motion.div>
      )}

      {/* Success feedback */}
      {!isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <Heart 
            className={`${iconSizes[size]} text-red-500 animate-pulse`}
            style={{ animationDuration: '1s' }}
          />
        </motion.div>
      )}
    </div>
  );
}
