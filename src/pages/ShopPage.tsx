import React, { useState, useEffect } from 'react';
import { Search, Filter, X, RotateCcw, Heart, Sparkles } from 'lucide-react';
import { Product, ProductCategory } from '../types/index.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '../data/initialProducts.ts';

interface ShopPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: {
    category?: ProductCategory | 'All';
    search?: string;
    wishlistOnly?: boolean;
    sort?: string;
  };
}

const DEFAULT_CATEGORIES: string[] = [
  'All',
  ...INITIAL_CATEGORIES.map((c) => c.name),
];

const COLOR_FILTERS = [
  { name: 'Tan', hex: '#A0612F' },
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'Cream', hex: '#F4EFE6' },
  { name: 'Emerald', hex: '#10452C' },
];

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, initialParams }) => {
  const { wishlist } = useWishlist();

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'All'>(
    initialParams?.category || 'All'
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialParams?.search || '');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<number>(1000);
  const [sortBy, setSortBy] = useState<string>(initialParams?.sort || 'newest');
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(
    Boolean(initialParams?.wishlistOnly)
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialParams?.category !== undefined) {
      setSelectedCategory(initialParams.category);
    }
    if (initialParams?.search !== undefined) {
      setSearchQuery(initialParams.search);
    }
    if (initialParams?.wishlistOnly !== undefined) {
      setShowWishlistOnly(initialParams.wishlistOnly);
    }
  }, [initialParams]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          const names = ['All', ...cats.filter((c: any) => c.active !== false).map((c: any) => c.name)];
          setCategoriesList(names);
        }
      })
      .catch((e) => console.warn('Categories API notice, using atelier catalog categories:', e));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }
      params.append('sort', sortBy);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      }
    } catch (err: any) {
      console.warn('Backend products fetch notice, keeping atelier products dataset:', err);
      // Filter locally from INITIAL_PRODUCTS
      if (selectedCategory !== 'All') {
        setProducts(INITIAL_PRODUCTS.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase()));
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    }
  };

  // Client-side composite filtering for interactive responsiveness
  const filteredProducts = products.filter((p) => {
    // Wishlist filter
    if (showWishlistOnly && !wishlist.includes(p.id)) {
      return false;
    }

    // Search query - smart multi-term matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);
      const pText = [
        p.name,
        p.description,
        p.category,
        p.materials,
        ...p.variations.map((v) => `${v.colorName} ${v.sku}`),
      ]
        .join(' ')
        .toLowerCase();

      // Check if all or any significant term matches
      const allTermsMatch = terms.every((t) => pText.includes(t));
      const anyTermMatch = terms.some((t) => pText.includes(t));
      if (!allTermsMatch && !anyTermMatch) return false;
    }

    // Color filter
    if (selectedColor) {
      const matchColor = p.variations.some((v) =>
        v.colorName.toLowerCase().includes(selectedColor.toLowerCase())
      );
      if (!matchColor) return false;
    }

    // Price range
    const effectivePrice = p.salePrice ?? p.price;
    if (effectivePrice > priceRange) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedColor(null);
    setPriceRange(1000);
    setShowWishlistOnly(false);
    setSortBy('newest');
  };

  const hasActiveFilters =
    selectedCategory !== 'All' ||
    searchQuery.trim() !== '' ||
    selectedColor !== null ||
    priceRange < 1000 ||
    showWishlistOnly;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Breadcrumb */}
      <div className="border-b border-[#EDE7DC] pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
              <button onClick={() => onNavigate('home')} className="hover:text-black">
                Home
              </button>
              <span>/</span>
              <span className="text-neutral-900 font-medium">Atelier Catalog</span>
              {showWishlistOnly && (
                <>
                  <span>/</span>
                  <span className="text-red-700 font-medium">My Wishlist</span>
                </>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
              {showWishlistOnly
                ? 'Your Saved Silhouettes'
                : selectedCategory === 'All'
                ? 'The Handbag Collection'
                : selectedCategory}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              Showing {filteredProducts.length} handcrafted models
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden px-4 py-2 bg-white border border-[#DDD7CD] rounded-lg text-xs font-medium text-neutral-800 flex items-center gap-2 shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-[#DDD7CD] rounded-lg px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="newest">Newest Releases</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills (Functional filter tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-2 scrollbar-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as any)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-[#E5DFD4] hover:bg-[#F5F2EB]'
              }`}
            >
              {cat}
            </button>
          ))}
          {wishlist.length > 0 && (
            <button
              onClick={() => setShowWishlistOnly(!showWishlistOnly)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                showWishlistOnly
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-[#E5DFD4] hover:bg-[#F5F2EB]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-current' : ''}`} />
              <span>Wishlist ({wishlist.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid & Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Filters (Desktop) */}
        <aside
          className={`lg:block ${
            mobileFilterOpen ? 'block' : 'hidden'
          } space-y-6 lg:border-r lg:border-[#EDE7DC] lg:pr-6`}
        >
          {/* Active Filter Clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE1]">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Active Filters
              </span>
              <button
                onClick={resetFilters}
                className="text-xs text-neutral-500 hover:text-black flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}

          {/* Search Within Catalog */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              Search Silhouettes
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Tote, calfskin, lock..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Color Palettes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-2">
              Color Family
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_FILTERS.map((col) => (
                <button
                  key={col.name}
                  onClick={() =>
                    setSelectedColor(selectedColor === col.name ? null : col.name)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-2 border transition-all ${
                    selectedColor === col.name
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-700 border-[#DDD7CD] hover:bg-[#F5F2EB]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span>{col.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Max Commission Price
              </label>
              <span className="text-xs font-medium text-neutral-900 tabular-nums">
                ${priceRange}
              </span>
            </div>
            <input
              type="range"
              min="200"
              max="1000"
              step="25"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full accent-neutral-900 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 mt-1 font-mono">
              <span>$200</span>
              <span>$1,000+</span>
            </div>
          </div>

          {/* Wishlist quick toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-700 select-none">
              <input
                type="checkbox"
                checked={showWishlistOnly}
                onChange={(e) => setShowWishlistOnly(e.target.checked)}
                className="rounded accent-neutral-900 w-4 h-4"
              />
              <span>Show saved wishlist items only</span>
            </label>
          </div>
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-[#F3EFE7] animate-pulse rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center bg-white rounded-xl border border-red-200">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-neutral-900 text-white rounded text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-xl border border-[#EDE8DF] space-y-4">
              <p className="text-lg font-serif text-neutral-800">
                No handbags match your exact filter criteria
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try widening your price range, clearing specific colors, or searching for alternative silhouettes.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
