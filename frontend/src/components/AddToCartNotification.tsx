import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface AddToCartNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  productName?: string;
  index?: number; // Index for stacking notifications vertically
}

const AddToCartNotification = ({ isVisible, onClose, productName, index = 0 }: AddToCartNotificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const previousVisibleRef = useRef(false);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      // Reset animation state when notification becomes visible again
      // This ensures the notification re-appears even if it was already visible
      setIsAnimating(false);
      // Force re-render by briefly hiding then showing
      const resetTimeout = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      
      // Auto-hide after 10 seconds
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 10000);
      
      return () => {
        clearTimeout(resetTimeout);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    } else {
      // Reset animation state when hidden
      setIsAnimating(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    previousVisibleRef.current = isVisible;
  }, [isVisible, handleClose]);

  const handleMouseEnter = () => {
    // Pause the timer when mouse enters
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Resume the timer when mouse leaves
    if (isVisible && isAnimating) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 10000);
    }
  };

  if (!isVisible) return null;

  // Calculate vertical offset based on index (each notification is ~80px tall + 16px gap)
  // Adjust height based on content - mobile notifications are slightly taller
  const notificationHeight = 80; // Approximate height of notification
  const gap = 16; // Gap between notifications
  const headerHeight = 64; // Navigation header height (h-16 = 64px)
  const spacingBelowHeader = 16; // Spacing below header (1rem)
  const topOffset = index * (notificationHeight + gap);

  return (
    <div 
      className={`fixed z-[60] transition-all duration-300 right-4 sm:right-6 lg:right-4 w-[calc(100%-2rem)] max-w-sm sm:max-w-md mx-auto sm:mx-0 ${
        isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      }`}
      style={{
        // Position below header: header height (64px) + spacing (16px) + offset for stacking
        // Each notification stacks 96px below the previous one
        top: `calc(${headerHeight}px + ${spacingBelowHeader}px + ${topOffset}px)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
              Item added to cart
            </h3>
            <div className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <p className="break-words">
                {productName ? `${productName} was added to your cart.` : 'The item was added to your cart.'}
              </p>
            </div>
          </div>
          <div className="ml-2 sm:ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              title="Close notification"
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md p-1"
              aria-label="Close notification"
            >
              <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCartNotification;


