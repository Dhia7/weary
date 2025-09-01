import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Categories from '@/components/Categories';
import FeaturedProducts from '@/components/FeaturedProducts';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <Hero />
      <Categories />
      <FeaturedProducts />
      <Footer />
    </div>
  );
}
