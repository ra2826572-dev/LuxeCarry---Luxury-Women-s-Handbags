import React, { useState } from 'react';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, params?: any) => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onNavigate,
  onQuickView,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  // Selected variation index for quick swatch preview
  const [selectedVarIdx, setSelectedVarIdx] = useState(0);
  const [imgLoadError, setImgLoadError] = useState(false);
  const currentVar = product.variations[selectedVarIdx] || product.variations[0];

  const currentPrice =
    currentVar?.salePrice ??
    currentVar?.price ??
    product.salePrice ??
    product.price;
  const originalPrice = currentVar?.price ?? product.price;
  const hasSale = product.salePrice != null || currentVar?.salePrice != null;

  const currentImage = currentVar?.images?.[0] || '';
  const isOutOfStock = (currentVar?.stock ?? 0) <= 0;
  const wishlisted = isInWishlist(product.id);

  const handleCardClick = () => {
    onNavigate('product', { id: product.id });
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentVar || isOutOfStock) return;
    addToCart(product, currentVar, 1);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white rounded-xl overflow-hidden border border-[#EDE8DF] hover:border-[#DDD5C7] hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Image container */}
      <div className="relative aspect-4/3 w-full bg-[#F5F2EB] overflow-hidden">
        {currentImage && !imgLoadError ? (
          <img
            src={currentImage}
            alt={`${product.name} - ${currentVar?.colorName}`}
            referrerPolicy="no-referrer"
            onError={() => setImgLoadError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F2EB] text-[#8C7A6B]">
            <ShoppingBag className="w-12 h-12 stroke-[1.2] mb-1.5 text-[#A37B24]" />
            <span className="text-[11px] font-serif tracking-widest uppercase text-neutral-500 font-medium">
              {product.name}
            </span>
          </div>
        )}

        {/* Minimal unboxed editorial status tags (NO PILL BADGES) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
          {product.isNew && (
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-xs shadow-xs">
              New Arrival
            </span>
          )}
          {hasSale && (
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8B3A3A] bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-xs shadow-xs">
              Atelier Privilege
            </span>
          )}
          {isOutOfStock && (
            <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-xs shadow-xs">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 z-10 ${
            wishlisted
              ? 'bg-white text-red-600 shadow-md'
              : 'bg-white/80 text-neutral-700 hover:text-black hover:bg-white shadow-xs'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? 'fill-current' : 'stroke-[1.5]'}`}
          />
        </button>

        {/* Floating Quick Action Drawer on Hover */}
        <div className="absolute inset-x-3 bottom-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-10">
          <button
            onClick={handleQuickAdd}
            disabled={isOutOfStock}
            className="flex-1 py-2 px-3 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-black transition-colors shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isOutOfStock ? 'Sold Out' : 'Quick Add'}</span>
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="p-2 bg-white text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors shadow-md"
              title="Quick inspect"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category unboxed text */}
          <div className="text-[11px] uppercase tracking-widest text-neutral-500 font-medium">
            {product.category}
          </div>

          {/* Product Name */}
          <h3 className="text-base font-serif font-semibold text-neutral-900 mt-1 line-clamp-1 group-hover:text-black transition-colors">
            {product.name}
          </h3>

          {/* Price with tabular numerals */}
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-sm font-semibold text-neutral-900 tabular-nums">
              ${currentPrice.toFixed(2)}
            </span>
            {hasSale && originalPrice > currentPrice && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Interactive Color Variations Swatches */}
        <div
          className="pt-2 border-t border-[#F2EEE6] flex items-center justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5">
            {product.variations.map((v, idx) => (
              <button
                key={v.id}
                onClick={() => setSelectedVarIdx(idx)}
                className={`w-4 h-4 rounded-full transition-all relative ${
                  selectedVarIdx === idx
                    ? 'ring-2 ring-neutral-900 ring-offset-1 scale-110'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: v.colorCode }}
                title={`${v.colorName} (${v.stock > 0 ? `${v.stock} in stock` : 'Sold out'})`}
                aria-label={`Select ${v.colorName}`}
              />
            ))}
          </div>

          <span className="text-[11px] text-neutral-500">
            {product.variations.length} {product.variations.length === 1 ? 'color' : 'colors'}
          </span>
        </div>
      </div>
    </div>
  );
};
