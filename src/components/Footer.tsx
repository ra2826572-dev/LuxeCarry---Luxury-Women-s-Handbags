import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-[#171615] text-[#ECE7DF] pt-16 pb-12 border-t border-neutral-800">
      {/* Brand Pillars & Trust Band */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 border-b border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-3.5">
            <Award className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Master Tuscan Craft</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Vegetable-tanned full grain leathers handcrafted in family-run Florentine ateliers.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <Truck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">White Glove Delivery</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Complimentary tracked and insured delivery on all orders over $300.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <RefreshCw className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">30-Day Atelier Return</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Complimentary exchanges and returns in pristine presentation condition.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Lifetime Atelier Care</h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Dedicated hardware restoration and leather nourishment service.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Info & Newsletter */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="text-2xl font-serif font-semibold text-white tracking-wide">
              LuxeCarry
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
              Devoted to the enduring beauty of architectural leatherwork, quiet luxury silhouettes, and bespoke artisanal hardware.
            </p>

            <div className="pt-2">
              <h4 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase mb-2">
                The Atelier Dispatch
              </h4>
              <p className="text-xs text-neutral-400 mb-3">
                Receive private invitations to limited colorway releases and private sales.
              </p>

              {subscribed ? (
                <p className="text-xs text-[#98C29D]">
                  Merci. You have been added to our private atelier registry.
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex max-w-sm">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-neutral-900 border border-neutral-700 rounded-l-md text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-[#D4AF37] text-neutral-950 font-medium text-xs rounded-r-md hover:bg-[#C29F2F] transition-colors flex items-center justify-center"
                    aria-label="Subscribe"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Collections */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Tote Bags' })}
                  className="hover:text-white transition-colors"
                >
                  Tote Bags
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Shoulder Bags' })}
                  className="hover:text-white transition-colors"
                >
                  Shoulder Bags
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Crossbody Bags' })}
                  className="hover:text-white transition-colors"
                >
                  Crossbody Bags
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Clutches' })}
                  className="hover:text-white transition-colors"
                >
                  Evening Clutches
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Backpacks' })}
                  className="hover:text-white transition-colors"
                >
                  City Backpacks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop', { category: 'Mini Bags' })}
                  className="hover:text-white transition-colors"
                >
                  Mini Sculptures
                </button>
              </li>
            </ul>
          </div>

          {/* Client Concierge */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">
              Concierge
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li>
                <button
                  onClick={() => onNavigate('account')}
                  className="hover:text-white transition-colors"
                >
                  Customer Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('account', { tab: 'orders' })}
                  className="hover:text-white transition-colors"
                >
                  Track Order Status
                </button>
              </li>
              <li>
                <span className="text-neutral-500 cursor-default">Leather Care Guide</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-default">Bespoke Monogramming</span>
              </li>
              <li>
                <span className="text-neutral-500 cursor-default">Shipping & Returns</span>
              </li>
            </ul>
          </div>

          {/* Atelier & Admin Portal */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200 tracking-wider uppercase">
              Atelier & Administration
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Via de' Tornabuoni, 14, 50123 Firenze FI, Italy<br />
              Client care: concierge@luxecarry.com
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('admin')}
                className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1.5"
              >
                <span>Authorized Admin Portal (/admin)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
        <div>
          © {new Date().getFullYear()} LuxeCarry Maison de Maroquinerie. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <span>Privacy Policy</span>
          <span>Terms of Sale</span>
          <span>Cookie Preferences</span>
        </div>
      </div>
    </footer>
  );
};
