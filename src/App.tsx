import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';

import { HomePage } from './pages/HomePage.tsx';
import { ShopPage } from './pages/ShopPage.tsx';
import { ProductDetailPage } from './pages/ProductDetailPage.tsx';
import { CheckoutPage } from './pages/CheckoutPage.tsx';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { AdminLoginPage } from './pages/AdminLoginPage.tsx';

function MainRouter() {
  const { isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParams, setPageParams] = useState<any>({});

  // Sync with browser hash for natural URL navigation and refresh persistence
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        setCurrentPage('home');
        setPageParams({});
        return;
      }

      const parts = hash.split('/');
      const page = parts[0];

      if (page === 'admin' && parts[1] === 'login') {
        setCurrentPage('admin-login');
        setPageParams({});
      } else if (page === 'admin') {
        setCurrentPage('admin');
        setPageParams({});
      } else if (page === 'product' && parts[1]) {
        setCurrentPage('product');
        setPageParams({ id: parts[1] });
      } else if (page === 'order-confirmation' && parts[1]) {
        setCurrentPage('order-confirmation');
        setPageParams({ orderId: parts[1] });
      } else if (['shop', 'checkout', 'account', 'home'].includes(page)) {
        setCurrentPage(page);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);

    if (page === 'home') {
      window.location.hash = '';
    } else if (page === 'admin-login') {
      window.location.hash = 'admin/login';
    } else if (page === 'product' && params.id) {
      window.location.hash = `product/${params.id}`;
    } else if (page === 'order-confirmation' && params.orderId) {
      window.location.hash = `order-confirmation/${params.orderId}`;
    } else {
      window.location.hash = page;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdminRoute = currentPage === 'admin' || currentPage === 'admin-login';

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFCFA] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Public Storefront Navbar */}
      {!isAdminRoute && (
        <Navbar onNavigate={navigateTo} currentPage={currentPage} />
      )}

      {/* Slide-over Shopping Bag Drawer */}
      <CartDrawer onNavigate={navigateTo} />

      {/* Main Routed Page */}
      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={navigateTo} />}

        {currentPage === 'shop' && (
          <ShopPage onNavigate={navigateTo} initialParams={pageParams} />
        )}

        {currentPage === 'product' && (
          <ProductDetailPage
            productId={pageParams.id || 'prod_verona_tote'}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage onNavigate={navigateTo} />
        )}

        {currentPage === 'order-confirmation' && (
          <OrderConfirmationPage
            orderId={pageParams.orderId}
            orderData={pageParams.orderData}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'account' && (
          <AccountPage
            onNavigate={navigateTo}
            initialTab={pageParams.tab || 'orders'}
          />
        )}

        {currentPage === 'admin-login' && (
          <AdminLoginPage onNavigate={navigateTo} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard onNavigate={navigateTo} />
        )}
      </main>

      {/* Public Storefront Footer */}
      {!isAdminRoute && <Footer onNavigate={navigateTo} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <MainRouter />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
