import React, { useState } from 'react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  ArrowLeft,
  Tag,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { ShippingAddress } from '../types/index.ts';

interface CheckoutPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    cart,
    subtotal,
    shippingCost,
    discountAmount,
    totalAmount,
    appliedCoupon,
    clearCart,
  } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ShippingAddress>({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    postalCode: user?.address?.postalCode || '',
    country: user?.address?.country || 'United States',
    deliveryInstructions: user?.address?.deliveryInstructions || '',
  });

  // Sync with logged-in user when user authentication state resolves
  React.useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: user.email || prev.email || '',
        phone: prev.phone || user.phone || '',
        street: prev.street || user.address?.street || '',
        city: prev.city || user.address?.city || '',
        postalCode: prev.postalCode || user.address?.postalCode || '',
        country: prev.country || user.address?.country || 'United States',
      }));
    }
  }, [user]);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'CARD'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          Add one of our handcrafted silhouettes before entering checkout.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold"
        >
          Explore Handbags
        </button>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.street.trim() ||
      !formData.city.trim() ||
      !formData.postalCode.trim()
    ) {
      setErrorMessage('Please complete all mandatory delivery and contact fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customer: formData,
        items: cart.map((i) => ({
          productId: i.productId,
          variationId: i.variationId,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.code || null,
        paymentMethod,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('luxecarry_token')
            ? { Authorization: `Bearer ${localStorage.getItem('luxecarry_token')}` }
            : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      // Success: clear cart and route to order confirmation
      clearCart();
      onNavigate('order-confirmation', { orderId: data.order.id, orderData: data.order });
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error placing order');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => onNavigate('shop')}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Continue Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Customer & Delivery Details Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handlePlaceOrder} className="space-y-8">
            {/* Header */}
            <div className="border-b border-[#EDE7DC] pb-4">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                Atelier Checkout
              </h1>
              <p className="text-xs text-neutral-500 mt-1">
                Handcrafted order dispatch from our European ateliers.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* 1. Contact Information */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-800">
                1. Connoisseur Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. eleanor@vance.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  {user?.email && (
                    <p className="text-[11px] text-[#24542B] mt-1 flex items-center gap-1 font-medium">
                      <span>📸</span>
                      <span>Order receipt screenshot will be sent to logged-in email: <strong>{user.email}</strong></span>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Telephone Contact * (for courier delivery coordination)
                </label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 019-2834"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div className="space-y-4 pt-4 border-t border-[#EDE7DC]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-800">
                2. Shipping Address
              </h2>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Street Address & Suite / Apt *
                </label>
                <input
                  type="text"
                  required
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="740 Park Avenue, Apt 12B"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="New York"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="10021"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  >
                    <option value="United States">United States</option>
                    <option value="France">France</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Italy">Italy</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Concierge / Delivery Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleChange}
                  placeholder="e.g. Leave with doorman; ring bell 4; require signature confirmation."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="space-y-4 pt-4 border-t border-[#EDE7DC]">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-800">
                3. Payment Privilege
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-neutral-900 bg-[#F9F7F2] ring-1 ring-neutral-900 shadow-xs'
                      : 'border-[#EDE8DF] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-neutral-800" />
                      <span className="text-xs font-semibold text-neutral-900">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    {paymentMethod === 'COD' && (
                      <CheckCircle2 className="w-4 h-4 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Inspect the parcel and packaging upon arrival; remit payment to the courier in cash or certified cheque.
                  </p>
                </div>

                {/* Online Card (Architecture prepared) */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-neutral-900 bg-[#F9F7F2] ring-1 ring-neutral-900 shadow-xs'
                      : 'border-[#EDE8DF] bg-white hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-neutral-800" />
                      <span className="text-xs font-semibold text-neutral-900">
                        Secure Card (Demo Gateway)
                      </span>
                    </div>
                    {paymentMethod === 'CARD' && (
                      <CheckCircle2 className="w-4 h-4 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Visa, MasterCard, Amex via 256-bit SSL encrypted tokenization.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-neutral-900 text-[#F5F2EB] rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-all shadow-md active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Verifying Atelier Inventory...'
                    : `Authorize & Place Order • $${totalAmount.toFixed(2)}`}
                </span>
              </button>
              <p className="text-[11px] text-center text-neutral-400 mt-2">
                By placing this order, you agree to LuxeCarry's terms of artisanal commission and returns policy.
              </p>
            </div>
          </form>
        </div>

        {/* Right: Order Summary Breakdown */}
        <div className="lg:col-span-5">
          <div className="bg-[#FAF8F4] rounded-2xl p-6 sm:p-8 border border-[#EAE4D7] sticky top-28 space-y-6">
            <h2 className="text-lg font-serif font-semibold text-neutral-900 border-b border-[#EAE4D7] pb-4">
              Atelier Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)})
            </h2>

            {/* Items snapshots */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={`${item.productId}-${item.variationId}`}
                  className="flex gap-3 pb-4 border-b border-[#EDE7DC] last:border-b-0"
                >
                  <img
                    src={item.image}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-18 object-cover rounded-md bg-[#F2EDE2] border border-[#DDD5C7] shrink-0"
                  />
                  <div className="flex-1 text-xs">
                    <h4 className="font-medium text-neutral-900 line-clamp-1">
                      {item.productName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-neutral-500 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full border border-neutral-300"
                        style={{ backgroundColor: item.colorCode }}
                      />
                      <span>{item.colorName}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px]">{item.sku}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-neutral-500">Qty: {item.quantity}</span>
                      <span className="font-semibold text-neutral-900 tabular-nums">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs text-neutral-600 pt-4 border-t border-[#EAE4D7]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-neutral-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#2E6838]">
                  <span>Privilege Code ({appliedCoupon?.code})</span>
                  <span className="tabular-nums font-medium">
                    -${discountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>White Glove Delivery</span>
                <span className="tabular-nums font-medium text-neutral-900">
                  {shippingCost === 0 ? 'Complimentary' : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-serif font-bold text-neutral-900 pt-3 border-t border-[#EAE4D7]">
                <span>Total Amount Due</span>
                <span className="tabular-nums">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Trust box */}
            <div className="p-4 bg-white rounded-xl border border-[#EDE8DF] space-y-2 text-xs text-neutral-600">
              <div className="flex items-center gap-2 font-medium text-neutral-900">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>Atelier Authenticity Seal</span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Every handbag includes a hand-numbered Florentine certificate of authenticity and velvet travel dust bag.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
