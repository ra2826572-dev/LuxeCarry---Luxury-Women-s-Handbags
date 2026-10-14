import React, { useState } from 'react';
import { X, Trash2, ArrowRight, ShieldCheck, Tag, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    shippingCost,
    discountAmount,
    totalAmount,
    appliedCoupon,
    couponError,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    await applyCoupon(couponInput.trim());
    setIsApplying(false);
  };

  const freeShippingThreshold = 300;
  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountRemaining = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFCFA] shadow-2xl flex flex-col justify-between border-l border-[#EAE6DF]">
          {/* Header */}
          <div className="p-6 border-b border-[#EAE6DF] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-neutral-800" />
              <h2 className="text-lg font-serif font-semibold text-neutral-900">
                Your Atelier Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-neutral-500 hover:text-black p-1 transition-colors"
              aria-label="Close bag"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Complimentary Shipping Progress */}
          <div className="bg-[#F8F5EE] px-6 py-3 border-b border-[#EAE6DF] text-xs text-neutral-700">
            {amountRemaining > 0 ? (
              <p className="mb-1.5">
                Add <span className="font-semibold text-neutral-900 tabular-nums">${amountRemaining.toFixed(2)}</span> more to unlock complimentary white-glove delivery.
              </p>
            ) : (
              <p className="text-[#3A6B48] font-medium flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="w-4 h-4" /> You've unlocked Complimentary White Glove Delivery.
              </p>
            )}
            <div className="w-full bg-[#E5DFD3] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-neutral-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mb-4">
                  <ShoppingBag className="w-8 h-8 text-neutral-400 stroke-[1.2]" />
                </div>
                <h3 className="text-lg font-serif font-medium text-neutral-900 mb-1">
                  Your bag is currently empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-xs mb-6">
                  Discover our timeless silhouettes handcrafted from the finest Tuscan and Parisian leathers.
                </p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onNavigate('shop');
                  }}
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-medium tracking-wide hover:bg-neutral-800 transition-colors"
                >
                  Explore Collections
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variationId}`}
                  className="flex gap-4 pb-6 border-b border-[#F0ECE1] last:border-b-0"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      setIsCartOpen(false);
                      onNavigate('product', { id: item.productId });
                    }}
                    className="w-20 h-24 bg-[#F5F2EB] rounded-lg overflow-hidden shrink-0 cursor-pointer relative group"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          onClick={() => {
                            setIsCartOpen(false);
                            onNavigate('product', { id: item.productId });
                          }}
                          className="text-sm font-medium text-neutral-900 hover:underline cursor-pointer line-clamp-1"
                        >
                          {item.productName}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.productId, item.variationId)}
                          className="text-neutral-400 hover:text-red-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      </div>

                      {/* Color variation & SKU */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-neutral-300 shrink-0"
                          style={{ backgroundColor: item.colorCode }}
                        />
                        <span>{item.colorName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[11px]">{item.sku}</span>
                      </div>

                      <div className="mt-2 text-sm font-medium text-neutral-900 tabular-nums">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-3 pt-2">
                      <div className="flex items-center border border-[#DDD7CD] rounded-md bg-white">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variationId, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-2.5 py-1 text-xs font-semibold tabular-nums text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variationId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          className="px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs text-neutral-500 font-mono tabular-nums">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Module */}
          {cart.length > 0 && (
            <div className="p-6 bg-white border-t border-[#EAE6DF] space-y-4">
              {/* Promo code */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between text-xs bg-[#F5F8F4] text-[#2E6838] p-2.5 rounded-lg border border-[#D5E5D8]">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      Privilege <strong className="font-semibold">{appliedCoupon.code}</strong> applied (-${discountAmount.toFixed(2)})
                    </span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs text-neutral-500 hover:text-red-600 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Privilege Code (e.g. LUXE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD7CD] rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-3.5 py-2 text-xs font-medium bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-xs text-red-600 mt-1">{couponError}</p>}

              {/* Order calculations */}
              <div className="space-y-1.5 text-xs text-neutral-600 pt-2 border-t border-[#F0ECE1]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="tabular-nums font-medium text-neutral-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#2E6838]">
                    <span>Atelier Privilege Discount</span>
                    <span className="tabular-nums font-medium">
                      -${discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="tabular-nums font-medium text-neutral-900">
                    {shippingCost === 0 ? 'Complimentary' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-neutral-900 pt-2 border-t border-[#F0ECE1]">
                  <span>Total Due</span>
                  <span className="tabular-nums">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  onNavigate('checkout');
                }}
                className="w-full py-3.5 px-4 bg-neutral-900 text-[#F5F2EB] rounded-full text-xs font-semibold tracking-wider hover:bg-neutral-800 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-center text-neutral-400">
                Guaranteed Authenticity · Cash on Delivery & Cards Accepted
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
