'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRightOnRectangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/lib/contexts/LanguageContext';

interface LogoutSuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  userName?: string;
  index?: number;
}

const LogoutSuccessNotification = ({
  isVisible,
  onClose,
  userName,
  index = 0,
}: LogoutSuccessNotificationProps) => {
  const { isFrench } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 10000);
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
    }, 300);
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (isVisible && isAnimating) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, 10000);
    }
  };

  if (!isVisible) return null;

  const notificationHeight = 96;
  const gap = 16;
  const headerHeight = 64;
  const spacingBelowHeader = 16;
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ArrowRightOnRectangleIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {userName
                ? (isFrench ? `À bientôt, ${userName} !` : `See you soon, ${userName}!`)
                : (isFrench ? 'Déconnexion réussie' : 'Signed out successfully')}
            </h3>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              <p>
                {isFrench
                  ? 'Votre session est terminée et votre compte est sécurisé.'
                  : 'Your session has ended and your account is secure.'}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {isFrench
                  ? 'Reconnectez-vous à tout moment pour accéder à vos commandes, votre liste de souhaits et vos préférences.'
                  : 'Sign in again anytime to access your orders, wishlist, and saved preferences.'}
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

export default LogoutSuccessNotification;
