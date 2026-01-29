'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ErrorNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
}

const ErrorNotification = ({ isVisible, onClose, message }: ErrorNotificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full mx-4 transition-all duration-300 ${
      isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Error
            </h3>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <p>{message || 'An error occurred. Please try again.'}</p>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              title="Close notification"
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorNotification;






