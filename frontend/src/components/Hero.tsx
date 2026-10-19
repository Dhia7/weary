import { getServerLanguage } from '@/lib/getServerLanguage';
import HeroBackgroundVideo from '@/components/HeroBackgroundVideo';
import HeroScrollButton from '@/components/HeroScrollButton';
import HeroAnimatedBadge from '@/components/HeroAnimatedBadge';
import HeroAnimatedCtas from '@/components/HeroAnimatedCtas';

export default async function Hero() {
  const isFrench = (await getServerLanguage()) === 'fr';

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-start dark:bg-swisse-ink md:aspect-video md:min-h-0 md:items-center"
    >
      <div className="absolute inset-0">
        <HeroBackgroundVideo isFrench={isFrench} />
        <div className="pointer-events-none absolute inset-0 bg-white/10 bg-gradient-to-t from-swisse-canvas via-swisse-canvas/40 to-transparent dark:from-background dark:via-background/50 dark:to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-swisse px-6 pb-52 pt-32 md:px-8 md:pb-16 md:pt-24 xl:mx-0 xl:max-w-[36rem] xl:pl-10 xl:pr-6">
        <div className="max-w-2xl">
          <HeroAnimatedBadge isFrench={isFrench} />
          <h1 className="mb-8 font-serif text-5xl leading-[1.1] text-swisse-ink dark:text-swisse-canvas sm:text-6xl md:text-7xl">
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
