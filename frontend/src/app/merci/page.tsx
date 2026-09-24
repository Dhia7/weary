import type { Metadata } from 'next';
import MerciExperience from '@/components/MerciExperience';

export const metadata: Metadata = {
  title: 'Merci',
  description:
    'Thank you for your Swisia order. Use code MERCI15 on your next order, follow @swisia.store, and leave a review.',
  alternates: {
    canonical: '/merci',
  },
};

export default function MerciPage() {
  return <MerciExperience />;
}
