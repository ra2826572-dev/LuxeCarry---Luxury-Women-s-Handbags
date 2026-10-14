import React, { useState } from 'react';
import { ShoppingBag, Heart, User, Search, Menu, X, Shield } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage }) => {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate('shop', { search: searchQuery.trim() });
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'All Collections', page: 'shop', params: { category: 'All' } },
    { label: 'Tote Bags', page: 'shop', params: { category: 'Tote Bags' } },
    { label: 'Shoulder Bags', page: 'shop', params: { category: 'Shoulder Bags' } },
    { label: 'Crossbody', page: 'shop', params: { category: 'Crossbody Bags' } },
    { label: 'Clutches', page: 'shop', params: { category: 'Clutches' } },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FCFCFA]/95 backdrop-blur-md border-b border-[#EAE6DF] transition-all">
      {/* Slim Promotional Announcement Bar */}
      {announcementVisible && (
        <div className="bg-[#1A1A1A] text-[#F5F2EB] text-xs py-2 px-4 flex items-center justify-between transition-all">
          <div className="mx-auto flex items-center gap-2 tracking-wide font-light">
            <span>Complimentary White Glove Delivery on orders over $300</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span>Handcrafted in Florence & Paris</span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="text-[#D4AF37] font-medium">Use code LUXE10 for 10% off</span>
          </div>
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="text-neutral-400 hover:text-white p-0.5 ml-2 text-xs"
            aria-label="Dismiss banner"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Navigation - 3 Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-neutral-800 p-1 hover:text-black focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="text-2xl sm:text-3xl font-serif tracking-tight font-semibold text-neutral-900 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 text-left"
          >
            LuxeCarry
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide text-neutral-700">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.page, item.params)}
              className="hover:text-black transition-colors relative py-1 text-sm whitespace-nowrap shrink-0 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-neutral-900 transition-all duration-200 group-hover:w-full" />
            </button>
          ))}
        </nav>

        {/* Zone 3: Functional utilities (Search, Wishlist, Account, Cart Bag) */}
        <div className="flex items-center gap-3 sm:gap-5 shrink-0">
          {/* Admin link badge if user is admin */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium bg-neutral-900 text-white px-3 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Admin Atelier</span>
            </button>
          )}

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="text-neutral-700 hover:text-black p-2 transition-colors relative"
            aria-label="Search collection"
          >
            <Search className="w-5 h-5 stroke-[1.5]" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => onNavigate('shop', { wishlistOnly: true })}
            className="text-neutral-700 hover:text-black p-2 transition-colors relative"
            aria-label="View Wishlist"
          >
            <Heart className="w-5 h-5 stroke-[1.5]" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={() => onNavigate('account')}
            className="text-neutral-700 hover:text-black p-2 transition-colors flex items-center gap-1.5"
            aria-label="Account profile"
          >
            <User className="w-5 h-5 stroke-[1.5]" />
            {user && (
              <span className="hidden xl:inline text-xs font-medium text-neutral-800 max-w-[100px] truncate">
                {user.name.split(' ')[0]}
              </span>
            )}
          </button>

          {/* Shopping Bag CTA */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 bg-neutral-900 text-[#F5F2EB] hover:bg-neutral-800 px-4 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-150 active:scale-95"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="w-4 h-4 stroke-[1.75]" />
            <span className="hidden sm:inline">Bag</span>
            <span className="font-semibold text-white ml-0.5 tabular-nums">
              ({totalItemsCount})
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Search Overlay */}
      {searchOpen && (
        <div className="bg-[#FAF8F5] border-t border-[#EAE6DF] px-4 py-4 animate-in slide-in-from-top duration-200">
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto flex items-center gap-3 relative"
          >
            <Search className="w-5 h-5 text-neutral-400 absolute left-3.5" />
            <input
              type="text"
              placeholder="Search handcrafted totes, crossbody, shoulder bags, leather types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-24 py-2.5 bg-white border border-[#DDD7CD] rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <button
              type="submit"
              className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-neutral-900 text-white rounded text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FCFCFA] border-t border-[#EAE6DF] px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.page, item.params);
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-base font-medium text-neutral-800 border-b border-[#F0ECE1]"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => {
                onNavigate('account');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 text-base font-medium text-neutral-800 border-b border-[#F0ECE1] flex items-center justify-between"
            >
              <span>{user ? `Account (${user.name})` : 'Sign In / Register'}</span>
              <User className="w-4 h-4 text-neutral-400" />
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 text-base font-medium text-[#D4AF37] flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Atelier Portal</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
