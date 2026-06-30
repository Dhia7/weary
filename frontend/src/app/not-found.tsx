'use client';

import NotFoundState from '@/components/NotFoundState';

export default function NotFound() {
  return (
    <NotFoundState
      title="Page Not Found"
      description="Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
    />
  );
}
