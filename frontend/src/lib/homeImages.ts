/** Home page imagery — local WebP for fast LCP. */
/** Matches original Unsplash hero (q=80 @ 1920px); optimizer uses 90 on WebP source. */
export const HERO_IMAGE_QUALITY = 90;

export const HOME_IMAGES = {
  /** High-res source (Unsplash q=80 @ 1920px); Next serves responsive WebP/AVIF. */
  hero: '/images/hero.jpg',
  womenCollection: '/images/women-collection.webp',
  menCollection: '/images/men-collection.webp',
  brandStory: '/images/brand-story.webp',
} as const;
