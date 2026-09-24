import type { Metadata } from 'next';
import SwisiaLaunchScene from '@/components/SwisiaLaunchScene';

export const metadata: Metadata = {
  title: 'Swisia — Launch',
  robots: { index: false, follow: false },
};

type Search = Promise<{ lang?: string }>;

export default async function SwisiaLaunchPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const params = await searchParams;
  const lang = params.lang === 'en' ? 'en' : 'fr';
  return <SwisiaLaunchScene lang={lang} />;
}
