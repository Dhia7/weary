'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface LoginSuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  userName?: string;
  index?: number; // Index for stacking notifications vertically
}

const LoginSuccessNotification = ({ isVisible, onClose, userName, index = 0 }: LoginSuccessNotificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 12 seconds (increased from 5)
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 12000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

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
      }, 12000);
    }
  };

  if (!isVisible) return null;

  // Calculate vertical offset based on index (each notification is ~80px tall + 16px gap)
  const notificationHeight = 80;
  const gap = 16;
  const headerHeight = 64; // Navigation header height (h-16 = 64px)
  const spacingBelowHeader = 16; // Spacing below header (1rem)
  const topOffset = index * (notificationHeight + gap);

  return (
    <div 
      className={`fixed z-[60] transition-all duration-300 right-4 sm:right-6 lg:right-4 w-[calc(100%-2rem)] max-w-sm sm:max-w-md mx-auto sm:mx-0 ${
        isAnimating ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      }`}
      style={{
        top: `calc(${headerHeight}px + ${spacingBelowHeader}px + ${topOffset}px)`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Welcome back! 🎉
            </h3>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <p>
                {userName ? `Hello ${userName}! You've successfully logged in.` : 'You have successfully logged in!'}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Start exploring our latest collection and find your perfect style.
              </p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              title="Close notification"
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginSuccessNotification;
