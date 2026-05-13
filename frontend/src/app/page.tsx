import dynamic from "next/dynamic";
import { Suspense } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HomeUrlNotifications from "../components/HomeUrlNotifications";

const HomeFeaturedCollections = dynamic(
  () => import("@/components/HomeFeaturedCollections"),
  { loading: () => <HomeSectionSkeleton /> }
);
const ManifestoBanner = dynamic(() => import("@/components/ManifestoBanner"), {
  loading: () => <HomeSectionSkeleton compact />,
});
const FeaturedProducts = dynamic(() => import("@/components/FeaturedProducts"), {
  loading: () => <HomeSectionSkeleton />,
});
const BrandStory = dynamic(() => import("@/components/BrandStory"), {
  loading: () => <HomeSectionSkeleton />,
});
const NewsletterSignup = dynamic(() => import("@/components/NewsletterSignup"), {
  loading: () => <HomeSectionSkeleton compact />,
});

function HomeSectionSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-hidden
      className={`animate-pulse bg-swisse-mist/60 dark:bg-muted/40 ${
        compact ? "h-48 md:h-56" : "h-[28rem] md:h-[32rem]"
      }`}
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-swisse-canvas dark:bg-background">
      <Suspense fallback={null}>
        <HomeUrlNotifications />
      </Suspense>
      <Navigation />
      <Hero />
      <HomeFeaturedCollections />
      <ManifestoBanner />
      <FeaturedProducts />
      <BrandStory />
      <NewsletterSignup />
      <Footer />
    </div>
  );
}
