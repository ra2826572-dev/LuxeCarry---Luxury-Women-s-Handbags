import React, { useState, useEffect } from 'react';
import {
  User,
  Package,
  LogOut,
  MapPin,
  Clock,
  Shield,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Order } from '../types/index.ts';

interface AccountPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialTab?: 'profile' | 'orders';
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate, initialTab }) => {
  const { user, login, register, logout, updateProfile, isAdmin } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>(initialTab || 'orders');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Profile edit states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileStreet, setProfileStreet] = useState(user?.address?.street || '');
  const [profileCity, setProfileCity] = useState(user?.address?.city || '');
  const [profilePostalCode, setProfilePostalCode] = useState(user?.address?.postalCode || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      setProfileStreet(user.address?.street || '');
      setProfileCity(user.address?.city || '');
      setProfilePostalCode(user.address?.postalCode || '');
      loadMyOrders();
    }
  }, [user]);

  const loadMyOrders = async () => {
    const token = localStorage.getItem('luxecarry_token');
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    const res = await login(email, password);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || 'Login failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    const res = await register(name, email, password);
    setAuthLoading(false);
    if (!res.success) {
      setAuthError(res.error || 'Registration failed');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Failed to update password');
      } else {
        setAuthSuccess('Password updated successfully! Logging you in...');
        const loginRes = await login(email, password);
        if (!loginRes.success) {
          setAuthError('Password was updated. Please sign in with your new password.');
          setAuthMode('login');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Password update failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateProfile({
      name: profileName,
      phone: profilePhone,
      address: {
        street: profileStreet,
        city: profileCity,
        postalCode: profilePostalCode,
      },
    });
    if (res.success) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  // Quick Demo fill helper
  const fillDemoCustomer = () => {
    setEmail('claire@example.com');
    setPassword('Customer123!');
  };

  const fillUserEmail = () => {
    setEmail('ra2826572@gmail.com');
    setPassword('59115911');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 pb-28">
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#EDE8DF] shadow-lg space-y-6">
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#A37B24]">
              Connoisseur Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
              {authMode === 'login' && 'Sign In with Your Email'}
              {authMode === 'register' && 'Create Your Account'}
              {authMode === 'reset' && 'Reset Account Password'}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {authMode === 'reset'
                ? 'Enter your email and choose a new password to recover access immediately.'
                : 'Manage your orders, saved addresses, and private commission privileges with your own email.'}
            </p>
          </div>

          {/* Tab selector */}
          <div className="flex border-b border-[#EAE4D7] text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
                authMode === 'login'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
                authMode === 'register'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('reset');
                setAuthError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-2.5 font-semibold text-center border-b-2 transition-colors ${
                authMode === 'reset'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* Quick Credential Test Helper */}
          <div className="p-3 bg-[#FAF8F4] border border-[#EAE4D7] rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-700">
                Quick Sign-In Helpers:
              </span>
              <button
                type="button"
                onClick={() => onNavigate('admin-login')}
                className="text-[11px] text-[#A37B24] hover:underline font-semibold flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                Admin Portal
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fillUserEmail}
                className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded text-[11px] text-neutral-800 hover:bg-neutral-50 transition-colors"
              >
                Autofill My Email (ra2826572@gmail.com)
              </button>
              <button
                type="button"
                onClick={fillDemoCustomer}
                className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded text-[11px] text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Autofill Claire (Demo)
              </button>
            </div>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
              <p>{authError}</p>
              {authError.includes('already exists') && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('reset');
                    setAuthError(null);
                  }}
                  className="mt-1 text-xs text-[#A37B24] font-semibold hover:underline block"
                >
                  Forgot your password? Click here to reset it for this email
                </button>
              )}
            </div>
          )}

          {authSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-md border border-emerald-200">
              {authSuccess}
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('reset');
                      setAuthError(null);
                    }}
                    className="text-[11px] text-[#A37B24] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vivienne Delacroix"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Creating Account...' : 'Create Atelier Account'}
              </button>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                  New Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-neutral-900 text-white rounded-full text-xs font-semibold tracking-wider hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? 'Updating Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#EDE7DC] text-center text-xs text-neutral-600">
            {authMode === 'login' && (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Create one here
                </button>
              </p>
            )}
            {authMode === 'register' && (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
            {authMode === 'reset' && (
              <p>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className="font-semibold text-neutral-900 hover:underline"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      {/* Top Banner with user welcome */}
      <div className="bg-[#FAF8F4] rounded-2xl p-6 sm:p-8 border border-[#EAE4D7] mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-[#A37B24]">
            Connoisseur Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mt-1">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-mono">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Admin Atelier Portal</span>
            </button>
          )}
          <button
            onClick={logout}
            className="px-4 py-2.5 bg-white border border-[#DDD7CD] text-neutral-700 rounded-full text-xs font-semibold hover:bg-[#F2ECE0] transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-[#EDE7DC] pb-3 mb-8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`text-xs font-semibold uppercase tracking-wider pb-2 relative transition-colors ${
            activeTab === 'orders' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <span>Order History ({orders.length})</span>
          {activeTab === 'orders' && (
            <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-neutral-900" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`text-xs font-semibold uppercase tracking-wider pb-2 relative transition-colors ${
            activeTab === 'profile' ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <span>Profile & Shipping Address</span>
          {activeTab === 'profile' && (
            <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-neutral-900" />
          )}
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-[#EDE8DF] space-y-4">
              <Package className="w-12 h-12 text-neutral-300 mx-auto" />
              <h3 className="text-base font-serif font-semibold text-neutral-900">
                No commissions placed yet
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Explore our curated handbag collection and select your signature silhouette.
              </p>
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800"
              >
                Explore Handbags
              </button>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-[#EDE8DF] p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F0ECE1] gap-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-neutral-900 mr-3">
                      {ord.id}
                    </span>
                    <span className="text-xs text-neutral-500">
                      Placed on {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2.5 py-1 rounded bg-[#EBF5EE] text-[#24542B]">
                      {ord.status}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900 tabular-nums">
                      ${ord.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ord.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-[#FAF8F5]"
                    >
                      <img
                        src={item.image}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-14 object-cover rounded bg-[#F2EDE2]"
                      />
                      <div className="text-xs flex-1">
                        <h4 className="font-semibold text-neutral-900">{item.productName}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                          <span
                            className="w-2 h-2 rounded-full border border-neutral-300"
                            style={{ backgroundColor: item.colorCode }}
                          />
                          <span>{item.colorName}</span>
                          <span>· Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-neutral-900 tabular-nums">
                        ${item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Status history log */}
                <div className="pt-2 text-xs text-neutral-500 flex items-center justify-between">
                  <span>
                    Payment:{' '}
                    <strong>{ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}</strong> (
                    {ord.paymentStatus})
                  </span>
                  <button
                    onClick={() => onNavigate('order-confirmation', { orderId: ord.id, orderData: ord })}
                    className="text-neutral-900 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Receipt</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-xl border border-[#EDE8DF] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleProfileSave} className="space-y-6">
            <h2 className="text-lg font-serif font-semibold text-neutral-900 border-b border-[#F0ECE1] pb-3">
              Personal Information & Default Delivery Address
            </h2>

            {profileSaved && (
              <div className="p-3 bg-[#F2F7F2] text-[#24542B] text-xs rounded-md border border-[#D5E5D8]">
                Profile successfully updated.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Telephone Contact
                </label>
                <input
                  type="text"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Street Address & Suite
              </label>
              <input
                type="text"
                value={profileStreet}
                onChange={(e) => setProfileStreet(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={profileCity}
                  onChange={(e) => setProfileCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={profilePostalCode}
                  onChange={(e) => setProfilePostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
