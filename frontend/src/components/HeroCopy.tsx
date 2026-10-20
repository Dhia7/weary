'use client';

import { useSyncExternalStore } from 'react';
import {
  getHeroCopyVisible,
  subscribeHeroCopyVisible,
} from '@/components/heroPlayback';

type HeroCopyProps = {
  children: React.ReactNode;
  className?: string;
};

export function useHeroCopyVisible() {
  return useSyncExternalStore(subscribeHeroCopyVisible, getHeroCopyVisible, () => false);
}

export default function HeroCopy({ children, className = '' }: HeroCopyProps) {
  const visible = useHeroCopyVisible();

  return (
    <div
      className={`transition-opacity duration-700 md:opacity-100 ${
        visible ? 'opacity-100' : 'max-md:opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}
