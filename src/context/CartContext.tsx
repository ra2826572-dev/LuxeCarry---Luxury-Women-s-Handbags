import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductColorVariation, Coupon } from '../types/index.ts';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variation: ProductColorVariation, quantity?: number) => boolean;
  updateQuantity: (productId: string, variationId: string, quantity: number) => void;
  removeFromCart: (productId: string, variationId: string) => void;
  clearCart: () => void;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  appliedCoupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'luxecarry_cart_items';
const COUPON_STORAGE_KEY = 'luxecarry_cart_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to persist coupon:', e);
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product, variation: ProductColorVariation, quantity = 1): boolean => {
    if (variation.stock <= 0) {
      return false;
    }

    const price = variation.salePrice ?? variation.price ?? product.salePrice ?? product.price;
    const salePrice = variation.salePrice ?? product.salePrice ?? null;
    const image = variation.images[0] || '';

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.variationId === variation.id
      );

      if (existingIdx >= 0) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = Math.min(currentQty + quantity, variation.stock);
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          maxStock: variation.stock,
          price,
          salePrice,
          image,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          productId: product.id,
          variationId: variation.id,
          quantity: Math.min(quantity, variation.stock),
          productName: product.name,
          colorName: variation.colorName,
          colorCode: variation.colorCode,
          sku: variation.sku,
          image,
          price,
          salePrice,
          maxStock: variation.stock,
        };
        return [...prev, newItem];
      }
    });

    setIsCartOpen(true);
    return true;
  };

  const updateQuantity = (productId: string, variationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, variationId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.variationId === variationId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.maxStock),
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, variationId: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variationId === variationId)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const effectivePrice = item.price;
    return acc + effectivePrice * item.quantity;
  }, 0);

  // Free shipping over $300, else $25 flat
  const shippingCost = subtotal > 0 && subtotal >= 300 ? 0 : subtotal > 0 ? 25 : 0;

  // Coupon discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minSpend) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.value) / 100 * 100) / 100;
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  const applyCoupon = async (code: string) => {
    setCouponError(null);
    if (!code.trim()) {
      setCouponError('Please enter a coupon code.');
      return { success: false, error: 'Please enter a coupon code.' };
    }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || 'Invalid promotional code.');
        return { success: false, error: data.error };
      }
      setAppliedCoupon(data.coupon);
      return { success: true };
    } catch (err: any) {
      setCouponError('Network error checking coupon.');
      return { success: false, error: 'Network error' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        shippingCost,
        discountAmount,
        totalAmount,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        isCartOpen,
        setIsCartOpen,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
