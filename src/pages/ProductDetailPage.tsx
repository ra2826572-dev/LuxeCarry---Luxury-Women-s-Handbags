import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Star,
  Check,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Product, ProductColorVariation } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { ReviewModal } from '../components/ReviewModal.tsx';

import { INITIAL_PRODUCTS } from '../data/initialProducts.ts';

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onNavigate,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const initialFallback = INITIAL_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null;
  const [product, setProduct] = useState<Product | null>(initialFallback);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(() => {
    if (initialFallback) {
      return INITIAL_PRODUCTS.filter((p) => p.category === initialFallback.category && p.id !== initialFallback.id).slice(0, 3);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Variation state
  const [selectedVariation, setSelectedVariation] = useState<ProductColorVariation | null>(
    initialFallback?.variations?.[0] || null
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'materials' | 'dimensions' | 'care' | 'delivery'>('materials');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setError(null);
    const localMatch = INITIAL_PRODUCTS.find((p) => p.id === productId || p.slug === productId);
    if (localMatch && !product) {
      setProduct(localMatch);
      if (localMatch.variations && localMatch.variations.length > 0) {
        setSelectedVariation(localMatch.variations[0]);
      }
    }

    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        if (!localMatch) throw new Error('Product not found or unavailable');
        return;
      }
      const data: Product = await res.json();
      setProduct(data);

      if (data.variations && data.variations.length > 0) {
        setSelectedVariation(data.variations[0]);
        setActiveImageIndex(0);
      }

      // Fetch related in same category
      const relRes = await fetch(`/api/products?category=${encodeURIComponent(data.category)}`);
      if (relRes.ok) {
        const relData: Product[] = await relRes.json();
        setRelatedProducts(relData.filter((p) => p.id !== data.id).slice(0, 3));
      }
    } catch (err: any) {
      if (!localMatch) {
        setError(err.message || 'Failed to load product');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-pulse">
          <div className="lg:col-span-7 aspect-4/3 bg-[#F2EDE2] rounded-xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 bg-[#F2EDE2] w-1/3 rounded" />
            <div className="h-10 bg-[#F2EDE2] w-3/4 rounded" />
            <div className="h-8 bg-[#F2EDE2] w-1/4 rounded" />
            <div className="h-32 bg-[#F2EDE2] rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product || !selectedVariation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
          Silhouette Not Available
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          {error || 'This luxury commission is currently not available.'}
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold"
        >
          Return to Atelier Catalog
        </button>
      </div>
    );
  }

  // Active variation details
  const currentImages = selectedVariation.images.length > 0
    ? selectedVariation.images
    : ['/src/assets/images/hero_luxe_carry_1791892799388.jpg'];

  const currentPrice =
    selectedVariation.salePrice ??
    selectedVariation.price ??
    product.salePrice ??
    product.price;

  const originalPrice = selectedVariation.price ?? product.price;
  const hasSale =
    selectedVariation.salePrice != null ||
    (selectedVariation.price == null && product.salePrice != null);

  const isOutOfStock = selectedVariation.stock <= 0;
  const wishlisted = isInWishlist(product.id);

  const handleColorChange = (variation: ProductColorVariation) => {
    setSelectedVariation(variation);
    setActiveImageIndex(0); // Reset to primary photo for this color
    setQuantity(1); // Reset requested quantity to 1
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const success = addToCart(product, selectedVariation, quantity);
    if (success) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 3000);
    }
  };

  const averageRating =
    product.reviews.length > 0
      ? (
          product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        ).toFixed(1)
      : '5.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-8">
        <button onClick={() => onNavigate('home')} className="hover:text-black">
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('shop', { category: product.category })}
          className="hover:text-black"
        >
          {product.category}
        </button>
        <span>/</span>
        <span className="text-neutral-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main PDP Grid (Contiguous Purchase Module) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14">
        {/* Left Gallery: Variation-Specific Image Display */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Hero Viewer */}
          <div className="relative aspect-4/3 w-full bg-[#F5F2EB] rounded-2xl overflow-hidden border border-[#EDE7DC] shadow-sm">
            <img
              src={currentImages[activeImageIndex] || currentImages[0]}
              alt={`${product.name} in ${selectedVariation.colorName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Out of stock watermark */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 bg-neutral-900 text-white rounded text-xs uppercase tracking-widest font-semibold shadow-md">
                  Currently Out of Stock in {selectedVariation.colorName}
                </span>
              </div>
            )}

            {/* Wishlist toggle */}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 p-2.5 rounded-full shadow-md transition-all ${
                wishlisted
                  ? 'bg-white text-red-600'
                  : 'bg-white/80 text-neutral-700 hover:text-black hover:bg-white'
              }`}
              aria-label="Save to Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Thumbnail Gallery (Filtered for selected color) */}
          {currentImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {currentImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden bg-[#F5F2EB] border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Category & Reviews Summary */}
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span className="uppercase tracking-widest font-semibold text-neutral-600">
                {product.category}
              </span>
              <div className="flex items-center gap-1.5 text-neutral-800">
                <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="font-semibold tabular-nums">{averageRating}</span>
                <span className="text-neutral-400">({product.reviews.length} reviews)</span>
              </div>
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-neutral-900 tracking-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-serif font-semibold text-neutral-900 tabular-nums">
                  ${currentPrice.toFixed(2)}
                </span>
                {hasSale && originalPrice > currentPrice && (
                  <span className="text-base text-neutral-400 line-through tabular-nums">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
                {hasSale && (
                  <span className="text-xs text-[#8B3A3A] font-medium bg-[#F9ECEC] px-2 py-0.5 rounded">
                    Privilege Savings
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-600 leading-relaxed font-light">
              {product.description}
            </p>

            {/* CRITICAL COLOR VARIATIONS SELECTOR */}
            <div className="pt-4 border-t border-[#EDE7DC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                  Leather Color:{' '}
                  <span className="text-neutral-900 font-bold normal-case ml-1">
                    {selectedVariation.colorName}
                  </span>
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  SKU: {selectedVariation.sku}
                </span>
              </div>

              {/* Swatch buttons */}
              <div className="flex items-center gap-3">
                {product.variations.map((v) => {
                  const isSelected = selectedVariation.id === v.id;
                  const vOutOfStock = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleColorChange(v)}
                      className={`group relative p-1 rounded-full transition-all flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      aria-label={`Select ${v.colorName}`}
                    >
                      <span
                        className="w-7 h-7 rounded-full border border-black/15 shadow-inner block"
                        style={{ backgroundColor: v.colorCode }}
                      />
                      {vOutOfStock && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-6 h-[1.5px] bg-red-600 rotate-45" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stock status indicator */}
              <div className="pt-1 flex items-center gap-2 text-xs">
                {selectedVariation.stock > 5 ? (
                  <span className="text-[#2E6838] font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Handcrafted & Ready to Ship ({selectedVariation.stock} in atelier)
                  </span>
                ) : selectedVariation.stock > 0 ? (
                  <span className="text-[#A0522D] font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Only {selectedVariation.stock} left in {selectedVariation.colorName}
                  </span>
                ) : (
                  <span className="text-red-700 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> Sold out in this color variation
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Selector & Add to Bag CTA */}
            <div className="pt-4 border-t border-[#EDE7DC] space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center border border-[#D5CDBD] rounded-full bg-white px-2 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock || quantity <= 1}
                    className="p-1.5 text-neutral-600 hover:text-black disabled:opacity-30 text-sm"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="px-4 text-xs font-semibold tabular-nums text-neutral-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(selectedVariation.stock, quantity + 1))
                    }
                    disabled={isOutOfStock || quantity >= selectedVariation.stock}
                    className="p-1.5 text-neutral-600 hover:text-black disabled:opacity-30 text-sm"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {/* Main Action Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 py-4 px-6 bg-neutral-900 text-[#F5F2EB] rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-all shadow-md active:scale-[0.99] disabled:bg-neutral-300 disabled:text-neutral-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {isOutOfStock
                      ? `Sold Out in ${selectedVariation.colorName}`
                      : `Add to Bag • $${(currentPrice * quantity).toFixed(2)}`}
                  </span>
                </button>
              </div>

              {addedNotice && (
                <div className="p-3 bg-[#F2F7F2] text-[#24542B] text-xs rounded-lg border border-[#D5E5D8] flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Added to your bag. Click Bag in navigation to inspect or checkout.</span>
                </div>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="pt-4 grid grid-cols-2 gap-4 text-xs text-neutral-600 border-t border-[#EDE7DC]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-neutral-800" />
                <span>Complimentary Delivery &gt; $300</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-neutral-800" />
                <span>Cash on Delivery Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion / Tabbed Specifications */}
      <div className="mt-16 pt-12 border-t border-[#EDE7DC]">
        <div className="flex items-center gap-6 border-b border-[#EDE7DC] pb-4 overflow-x-auto">
          {[
            { id: 'materials', label: 'Craftsmanship & Materials' },
            { id: 'dimensions', label: 'Dimensions & Fit' },
            { id: 'care', label: 'Care & Preservation' },
            { id: 'delivery', label: 'Delivery & Returns' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-semibold uppercase tracking-wider pb-2 relative transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-[-17px] left-0 right-0 h-[2px] bg-neutral-900" />
              )}
            </button>
          ))}
        </div>

        <div className="py-8 max-w-3xl text-sm text-neutral-700 leading-relaxed font-light">
          {activeTab === 'materials' && (
            <div className="space-y-3">
              <p>{product.materials}</p>
              <p className="text-xs text-neutral-500">
                Every skin is inspected by hand in our Florence tannery and treated exclusively with natural vegetable extracts (chestnut and mimosa) for an organic patina that grows richer with every passing year.
              </p>
            </div>
          )}

          {activeTab === 'dimensions' && (
            <div className="space-y-3">
              <p className="font-mono text-xs text-neutral-900">{product.dimensions}</p>
              <p className="text-xs text-neutral-500">
                Carefully tailored proportions engineered to cradle daily essentials including smartphones, continental wallets, cosmetics, and tablets without bulging.
              </p>
            </div>
          )}

          {activeTab === 'care' && (
            <div className="space-y-3">
              <p>{product.careInstructions}</p>
              <p className="text-xs text-neutral-500">
                To maintain the structured silhouette, store upright in the complimentary organic cotton dust bag when not in use.
              </p>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-3">
              <p>
                <strong>Complimentary White Glove Delivery:</strong> Available for all commissions exceeding $300. Standard delivery delivers within 2–4 business days with signature confirmation.
              </p>
              <p>
                <strong>Cash on Delivery (COD):</strong> You may inspect the parcel exterior and pay upon arrival directly to the courier.
              </p>
              <p>
                <strong>Returns:</strong> 30 days complimentary returns with all original security seals, tags, and dust bags intact.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verified Reviews Section */}
      <section className="mt-16 pt-12 border-t border-[#EDE7DC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-8 border-b border-[#EDE7DC] gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Client Impressions & Reviews
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
              <div className="flex text-[#D4AF37]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="font-semibold text-neutral-900 tabular-nums">
                {averageRating} out of 5.0
              </span>
              <span>· {product.reviews.length} verified reviews</span>
            </div>
          </div>

          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-5 py-2.5 bg-white border border-[#D5CDBD] text-neutral-900 rounded-full text-xs font-semibold hover:bg-[#F2ECE0] transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>
        </div>

        <div className="mt-8 space-y-6">
          {product.reviews.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-6">
              Be the first connoisseur to review this silhouette.
            </p>
          ) : (
            product.reviews.map((rev) => (
              <div key={rev.id} className="pb-6 border-b border-[#F0ECE1] space-y-2 last:border-b-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-900">{rev.author}</span>
                    {rev.verifiedPurchase && (
                      <span className="text-[10px] text-[#2E6838] font-medium bg-[#EBF5EE] px-1.5 py-0.5 rounded">
                        Verified Atelier Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">{rev.date}</span>
                </div>
                <div className="flex text-[#D4AF37]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-neutral-700 font-light leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-12 border-t border-[#EDE7DC]">
          <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-8">
            Complete the Wardrobe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Review Modal */}
      <ReviewModal
        productId={product.id}
        productName={product.name}
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onReviewSubmitted={loadProduct}
      />
    </div>
  );
};
