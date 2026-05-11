'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/contexts/LanguageContext';

const Footer = () => {
  const [currentYear, setCurrentYear] = useState('');
  const { isFrench } = useLanguage();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const footerLinks = {
    shop: [
      { name: 'Women', href: '/category/women' },
      { name: 'Men', href: '/category/men' },
      { name: 'Accessories', href: '/category/accessories' },
      { name: 'Footwear', href: '/category/footwear' },
      { name: 'Jewelry', href: '/category/jewelry' },
    ],
    support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'Help Center', href: '/help' },
      { name: 'Returns & Exchanges', href: '/returns' },
      { name: 'Size Guide', href: '/size-guide' },
      { name: 'Shipping Info', href: '/shipping' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Press', href: '/press' },
      { name: 'Blog', href: '/blog' },
      { name: 'Sustainability', href: '/sustainability' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Accessibility', href: '/accessibility' },
    ],
  };

  const translatedFooterLinks = isFrench
    ? {
        shop: [
          { name: 'Femmes', href: '/category/women' },
          { name: 'Hommes', href: '/category/men' },
          { name: 'Accessoires', href: '/category/accessories' },
          { name: 'Chaussures', href: '/category/footwear' },
          { name: 'Bijoux', href: '/category/jewelry' },
        ],
        support: [
          { name: 'Contact', href: '/contact' },
          { name: 'Centre d aide', href: '/help' },
          { name: 'Retours et echanges', href: '/returns' },
          { name: 'Guide des tailles', href: '/size-guide' },
          { name: 'Infos livraison', href: '/shipping' },
        ],
        company: [
          { name: 'A propos', href: '/about' },
          { name: 'Carrieres', href: '/careers' },
          { name: 'Presse', href: '/press' },
          { name: 'Blog', href: '/blog' },
          { name: 'Durabilite', href: '/sustainability' },
        ],
        legal: [
          { name: 'Confidentialite', href: '/privacy' },
          { name: 'Conditions de service', href: '/terms' },
          { name: 'Politique cookies', href: '/cookies' },
          { name: 'Accessibilite', href: '/accessibility' },
        ],
      }
    : footerLinks;

  return (
    <footer className="bg-swisse-canvas dark:bg-background border-t border-swisse-gold/10 dark:border-border text-swisse-ink dark:text-foreground">
      <div className="max-w-swisse mx-auto px-6 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="font-serif text-2xl tracking-[0.2em] uppercase text-swisse-ink dark:text-foreground inline-block mb-6"
            >
              Swissé
            </Link>
            <p className="text-swisse-ink/70 dark:text-muted-foreground mb-8 max-w-md leading-relaxed text-sm">
              {isFrench
                ? 'Swissé vous apporte des produits internationaux premium en Tunisie en moins d’une semaine — qualité authentique, prix équitables en TND et sans intermédiaires.'
                : 'Swissé brings premium international products to Tunisia in under a week — authentic quality, fair TND pricing, and no middlemen.'}
            </p>

            <div className="flex gap-5">
              <a
                href="#"
                className="text-swisse-gold hover:text-swisse-ink dark:hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-swisse-gold hover:text-swisse-ink dark:hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.49 0-.875-.385-.875-.875s.385-.875.875-.875.875.385.875.875-.385.875-.875.875zm-7.83 12.435c-2.026 0-3.744-.875-5.025-2.156C2.573 16.405 1.698 14.687 1.698 12.661s.875-3.744 2.156-5.025c1.281-1.281 2.999-2.156 5.025-2.156s3.744.875 5.025 2.156c1.281 1.281 2.156 2.999 2.156 5.025s-.875 3.744-2.156 5.025c-1.281 1.281-2.999 2.156-5.025 2.156z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-swisse-gold hover:text-swisse-ink dark:hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-lg text-swisse-gold mb-4">{isFrench ? 'Boutique' : 'Shop'}</h3>
            <ul className="space-y-2.5">
              {translatedFooterLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-swisse-ink/80 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg text-swisse-gold mb-4">{isFrench ? 'Support' : 'Support'}</h3>
            <ul className="space-y-2.5">
              {translatedFooterLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-swisse-ink/80 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg text-swisse-gold mb-4">{isFrench ? 'Entreprise' : 'Company'}</h3>
            <ul className="space-y-2.5">
              {translatedFooterLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-swisse-ink/80 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg text-swisse-gold mb-4">{isFrench ? 'Legal' : 'Legal'}</h3>
            <ul className="space-y-2.5">
              {translatedFooterLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-swisse-ink/80 hover:text-swisse-gold dark:text-muted-foreground dark:hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-swisse-gold/10 dark:border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-swisse-ink/50 dark:text-muted-foreground tracking-wide">
            {isFrench
              ? `© ${currentYear} Swisse. Tous droits reserves.`
              : `© ${currentYear} Swissé. All rights reserved.`}
          </p>
          <div className="flex gap-3 opacity-40">
            <div className="h-7 w-11 rounded bg-swisse-mist dark:bg-muted" />
            <div className="h-7 w-11 rounded bg-swisse-mist dark:bg-muted" />
            <div className="h-7 w-11 rounded bg-swisse-mist dark:bg-muted" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
