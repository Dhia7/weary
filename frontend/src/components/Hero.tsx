import Image from 'next/image';
import { HOME_IMAGES, HERO_IMAGE_QUALITY } from '@/lib/homeImages';
import { getServerLanguage } from '@/lib/getServerLanguage';
import HeroScrollButton from '@/components/HeroScrollButton';
import HeroAnimatedBadge from '@/components/HeroAnimatedBadge';
import HeroAnimatedCtas from '@/components/HeroAnimatedCtas';

export default async function Hero() {
  const isFrench = (await getServerLanguage()) === 'fr';

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center dark:bg-swisse-ink"
    >
      <div className="absolute inset-0">
        <Image
          src={HOME_IMAGES.hero}
          alt={isFrench ? 'Hero mode suisse' : 'Swiss fashion hero'}
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={HERO_IMAGE_QUALITY}
        />
        <div className="absolute inset-0 bg-white/10 bg-gradient-to-t from-swisse-canvas via-swisse-canvas/40 to-transparent dark:from-background dark:via-background/50 dark:to-transparent" />
      </div>

      <div className="relative z-10 max-w-swisse mx-auto px-6 md:px-8 w-full pt-24 pb-32 md:pb-40">
        <div className="max-w-2xl">
          <HeroAnimatedBadge isFrench={isFrench} />
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1] mb-8 text-swisse-ink dark:text-swisse-canvas">
            {isFrench ? 'Le Luxe Suisse,' : 'Swiss Luxury,'} <br />
            {isFrench ? 'Livre Chez Vous' : 'Delivered to Your Door'}
          </h1>
          <div className="mb-10 max-w-xl space-y-3 text-base text-swisse-ink/90 dark:text-swisse-canvas/90 sm:text-lg sm:leading-[1.65] font-normal leading-[1.6]">
            <p>
              {isFrench ? (
                <>
                  En moins d’une semaine, Swisia vous livre des{' '}
                  <strong className="font-semibold text-swisse-ink dark:text-swisse-canvas">
                    créations premium internationales
                  </strong>
                  , soigneusement sélectionnées — mode et lifestyle.
                </>
              ) : (
                <>
                  In under a week, Swisia brings you{' '}
                  <strong className="font-semibold text-swisse-ink dark:text-swisse-canvas">
                    carefully selected international premium pieces
                  </strong>
                  — fashion and lifestyle.
                </>
              )}
            </p>
            <p className="text-swisse-ink/75 dark:text-swisse-canvas/80">
              {isFrench
                ? 'Authenticité, qualité et élégance. Sans intermédiaires, à des prix honnêtes en TND.'
                : 'Authenticity, quality, and elegance. No middlemen — honest prices in TND.'}
            </p>
          </div>
          <HeroAnimatedCtas isFrench={isFrench} />
        </div>
      </div>

      <HeroScrollButton isFrench={isFrench} />
    </section>
  );
}
