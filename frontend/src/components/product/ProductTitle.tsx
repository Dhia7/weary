import { getProductTitleParts } from '@/lib/i18n/product';

interface ProductTitleProps {
  product: { name: string; nameFr?: string | null; brand?: string | null };
  isFrench?: boolean;
  className?: string;
  brandClassName?: string;
  /** stack = brand on its own line above the title (default). inline = same line. */
  layout?: 'stack' | 'inline';
}

export default function ProductTitle({
  product,
  isFrench = false,
  className,
  brandClassName = '',
  layout = 'stack',
}: ProductTitleProps) {
  const { brand, rest } = getProductTitleParts(product, isFrench);
  const title = rest || brand || '';

  if (!brand || layout === 'inline') {
    if (!brand) {
      return <span className={className}>{title}</span>;
    }
    return (
      <span className={className}>
        <span className={`font-bold ${brandClassName}`}>{brand}</span>
        {rest ? <> {rest}</> : null}
      </span>
    );
  }

  return (
    <span className="block min-w-0">
      <span className={`block font-bold ${brandClassName}`}>{brand}</span>
      {rest ? <span className={`block ${className || ''}`}>{rest}</span> : null}
    </span>
  );
}
