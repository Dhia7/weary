'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

const Hero = () => {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/hero-image.jpg"
        alt="Latest Collections"
        fill
        className="object-cover"
        priority
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center lg:text-left max-w-3xl">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl drop-shadow-lg">
              <span className="block">Discover Your</span>
              <span className="block text-indigo-300">Unique Style</span>
            </h1>
            <p className="mt-3 text-base text-white sm:mt-5 sm:text-lg md:mt-5 md:text-xl drop-shadow-lg">
              Elevate your wardrobe with premium fashion and accessories. Shop the latest collections and enjoy fast, reliable shipping on all orders.
            </p>
            <div className="mt-8 sm:flex sm:justify-center lg:justify-start gap-3">
              <Link
                href="/products"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition-colors shadow-lg"
              >
                Shop Now
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/categories"
                className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-indigo-600 md:py-4 md:text-lg md:px-10 transition-colors shadow-lg mt-3 sm:mt-0"
              >
                Shop Categories
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
