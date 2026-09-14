'use client';

import Link from 'next/link';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Instagram } from 'lucide-react';
import { INSTAGRAM_URL, getSoldInquiryHref } from '@/lib/shopLinks';
import { bodyTextClass } from '@/lib/content-page-styles';
import type { ProductTranslations } from '@/lib/i18n/product';
import { soldAskButtonClass } from '@/components/product/SoldAskButton';

interface SoldInquiryPanelProps {
  slug: string;
  sku?: string | null;
  displayName: string;
  t: ProductTranslations;
}

export default function SoldInquiryPanel({
  slug,
  sku,
  displayName,
  t,
}: SoldInquiryPanelProps) {
  const href = getSoldInquiryHref({ slug, name: displayName, sku });

  return (
    <div className="border-2 border-swisse-gold bg-swisse-gold/10 dark:bg-primary/10 p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-swisse-gold">
        {t.soldInquiryTitle}
      </p>
      <p className={`text-sm ${bodyTextClass}`}>{t.soldInquiryBody}</p>
      <Link href={href} className={soldAskButtonClass}>
        <EnvelopeIcon className="w-5 h-5" />
        {t.askAboutPiece}
      </Link>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full border border-swisse-gold/40 text-swisse-ink hover:border-swisse-gold hover:text-swisse-gold text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 transition-colors flex items-center justify-center gap-2 dark:text-foreground"
      >
        <Instagram className="w-5 h-5" />
        {t.dmInstagram}
      </a>
    </div>
  );
}
