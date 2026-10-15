import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, Compass, Star, Search } from 'lucide-react';
import { Product, ProductCategory } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { INITIAL_PRODUCTS } from '../data/initialProducts.ts';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

const CATEGORIES: { name: ProductCategory; subtitle: string; image: string }[] = [
  {
    name: 'Tote Bags',
    subtitle: 'Structured everyday workhorses',
    image: '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
  },
  {
    name: 'Shoulder Bags',
    subtitle: 'Graceful silhouettes & gourmette chains',
    image: '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
  },
  {
    name: 'Crossbody Bags',
    subtitle: 'Hands-free architectural elegance',
    image: '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
  },
  {
    name: 'Clutches',
    subtitle: 'Sculptural evening minaudières',
    image: '/src/assets/images/bag_elysee_clutch_emerald_1791892800669.jpg',
  },
  {
    name: 'Backpacks',
    subtitle: 'Streamlined executive leather packs',
    image: '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
  },
  {
    name: 'Mini Bags',
    subtitle: 'Delicate statements & micro silhouettes',
    image: '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
  },
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch((e) => {
        console.warn('Backend products fetch notice, utilizing local atelier products:', e);
      });
  }, []);

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      onNavigate('shop', { search: heroSearch.trim() });
    } else {
      onNavigate('shop');
    }
  };

  const featuredProducts = products.filter((p) => p.featured || p.isBestSeller).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">
      {/* 1. EDITORIAL HERO SECTION */}
      <section className="relative overflow-hidden bg-[#FAF7F0] border-b border-[#EAE4D7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6 lg:pr-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-neutral-600">
                <span>The Florence Atelier Collection</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#A37B24]">Spring / Summer 2026</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-neutral-900 tracking-tight leading-[1.1] text-balance">
                Artisanal Poise. Unrivaled Silhouettes.
              </h1>

              <p className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl font-light">
                Handcrafted from full-grain Tuscan calfskin with satin champagne gold hardware.
                Engineered for women who demand quiet luxury without compromise.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={() => onNavigate('shop')}
                  className="px-8 py-4 bg-neutral-900 text-[#F5F2EB] rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2.5"
                >
                  <span>Explore The Full Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('shop', { category: 'Tote Bags' })}
                  className="px-7 py-4 bg-white border border-[#D5CDBD] text-neutral-800 rounded-full text-xs font-semibold tracking-wider hover:bg-[#F2ECE0] transition-colors flex items-center justify-center"
                >
                  Discover Signature Totes
                </button>
              </div>

              {/* Find Handbags Quick Search Bar */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="pt-2 max-w-xl"
              >
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Find handbags by name, color, style (e.g. Verona, Roma, Emerald)..."
                    className="w-full pl-11 pr-24 py-3 bg-white border border-[#D5CDBD] rounded-full text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 shadow-xs"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Find
                  </button>
                </div>
                {/* Popular searches */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-neutral-500">
                  <span className="font-medium text-neutral-600">Quick find:</span>
                  {['Verona Tote', 'Roma Trapeze', 'Emerald', 'Crossbody', 'Shoulder Bags'].map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => onNavigate('shop', { search: term })}
                      className="px-2.5 py-0.5 bg-white/80 hover:bg-white border border-[#E0D8CB] rounded-full text-neutral-700 hover:text-black transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </form>

              {/* Editorial Quality Badges */}
              <div className="pt-6 border-t border-[#EAE3D4] grid grid-cols-3 gap-4 text-xs text-neutral-600">
                <div>
                  <span className="font-serif text-lg font-bold text-neutral-900 block tabular-nums">100%</span>
                  <span>Tuscan Calfskin</span>
                </div>
                <div>
                  <span className="font-serif text-lg font-bold text-neutral-900 block tabular-nums">14+</span>
                  <span>Atelier Hours</span>
                </div>
                <div>
                  <span className="font-serif text-lg font-bold text-neutral-900 block tabular-nums">Lifetime</span>
                  <span>Leather Warranty</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#E0D8C8] aspect-16/10 lg:aspect-4/3 bg-[#F0EAE1]">
                <img
                  src="/src/assets/images/hero_luxe_carry_1791892799388.jpg"
                  alt="LuxeCarry editorial campaign - Luxury leather shoulder bag"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-[#EDE7DC] shadow-md flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A37B24]" />
                  <span className="text-xs font-medium text-neutral-900">
                    Featured: The Verona Tote in Saddle Tan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              Curated Silhouettes
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
              Shop by Silhouette
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              onClick={() => onNavigate('shop', { category: cat.name })}
              className="group cursor-pointer flex flex-col items-center text-center p-3 sm:p-4 rounded-xl bg-white border border-[#EDE8DF] hover:border-[#DDD5C7] hover:shadow-md transition-all duration-300"
            >
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#F5F2EB] mb-3 relative">
                <img
                  src={cat.image}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
                />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 group-hover:text-black">
                {cat.name}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1 hidden sm:block">
                {cat.subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS & BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              Icons of the Atelier
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
              Featured Best Sellers
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop', { featured: true })}
            className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>Explore All Icons</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-[#F3EFE7] animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. PROMOTIONAL ATELIER PRIVILEGE BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden bg-[#1E1C1A] text-[#F5F2EB] p-8 sm:p-12 lg:p-16 border border-neutral-800 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-semibold tracking-widest uppercase text-[#D4AF37]">
                Privilege of the Season
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
                Receive 10% Off Your First Handbag Commission
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
                Experience the tactile luxury of hand-stitched Florentine leather. Enter code{' '}
                <strong className="text-white font-mono bg-neutral-800 px-2 py-0.5 rounded">LUXE10</strong>{' '}
                during checkout. Includes complimentary gift boxing and dust bag.
              </p>
            </div>
            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                onClick={() => onNavigate('shop')}
                className="px-8 py-3.5 bg-[#D4AF37] text-neutral-950 rounded-full text-xs font-semibold tracking-wider hover:bg-[#C29F2F] transition-all shadow-md active:scale-95 whitespace-nowrap"
              >
                Claim Atelier Privilege
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
                Fresh Off The Bench
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
                New Atelier Releases
              </h2>
            </div>
            <button
              onClick={() => onNavigate('shop', { sort: 'newest' })}
              className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1.5 self-start md:self-auto"
            >
              <span>View All Releases</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. VERIFIED ATELIER CLIENT REVIEWS */}
      <section className="bg-[#FAF7F0] py-16 border-y border-[#EDE7DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
              Client Testimonials
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
              Enduring Appreciation
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 mt-2">
              Reviews from verified connoisseurs across Paris, London, and New York.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE8DF] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex text-[#D4AF37] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed italic font-serif">
                  "The Verona Tote in Saddle Tan is immaculate. The edge painting is laser-precise, and the bag has maintained its architectural crispness even after months of daily commute."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] text-xs">
                <span className="font-semibold text-neutral-900 block">Camille Renaud</span>
                <span className="text-neutral-500">Creative Director · Paris, France</span>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE8DF] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex text-[#D4AF37] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed italic font-serif">
                  "The Monaco Crossbody lock has a weighty, satisfying click that rivals high-jewelry houses. People stop me on Madison Avenue to ask where it's from."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] text-xs">
                <span className="font-semibold text-neutral-900 block">Victoria Stern</span>
                <span className="text-neutral-500">Managing Partner · New York, USA</span>
              </div>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl border border-[#EDE8DF] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex text-[#D4AF37] mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed italic font-serif">
                  "Ordered with Cash on Delivery to test the process. The courier arrived in a tailored uniform with white gloves and the packaging was pure luxury."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0ECE1] text-xs">
                <span className="font-semibold text-neutral-900 block">Astrid Lindgren</span>
                <span className="text-neutral-500">Architect · Zurich, Switzerland</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
