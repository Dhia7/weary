'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Camera } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';

interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-24 h-24',
};

export default function ProfileAvatar({
  firstName,
  lastName,
  avatarUrl,
  size = 'md',
  editable = false,
}: ProfileAvatarProps) {
  const { uploadAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const imageSrc = getImageUrl(avatarUrl);
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || '?';

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB');
      return;
    }

    setIsUploading(true);
    setError('');

    const result = await uploadAvatar(file);
    if (!result.success) {
      setError(result.message);
    }

    setIsUploading(false);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-blue-600 flex items-center justify-center ring-2 ring-white dark:ring-gray-800`}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={`${firstName} ${lastName}`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-white font-semibold text-lg">{initials}</span>
          )}
        </div>

        {editable && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white flex items-center justify-center shadow-md transition-colors"
              aria-label="Change profile photo"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload profile photo"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {editable && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {avatarUrl ? 'Tap camera to change photo' : 'Add a profile photo'}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center max-w-[12rem]">{error}</p>
      )}
    </div>
  );
}
