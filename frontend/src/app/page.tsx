import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import HomeFeaturedCollections from "@/components/HomeFeaturedCollections";
import ManifestoBanner from "@/components/ManifestoBanner";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandStory from "@/components/BrandStory";
import NewsletterSignup from "@/components/NewsletterSignup";
import HomeUrlNotifications from "../components/HomeUrlNotifications";
import { Suspense } from "react";

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
