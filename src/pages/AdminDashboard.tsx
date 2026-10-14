import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Search,
  ExternalLink,
  Upload,
  ArrowUp,
  ArrowDown,
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  DollarSign,
  ShieldAlert,
  Database,
  Copy,
  RefreshCw,
  Camera,
  Mail,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Product,
  Order,
  AdminStats,
  CategoryItem,
  Coupon,
  StoreSettings,
  CustomerSummary,
  ProductColorVariation,
  OrderStatus,
  EmailNotificationLog,
} from '../types/index.ts';

interface AdminDashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'discounts'
  | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, token, isAdmin, logout } = useAuth();

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>([]);

  // Loading & notification states
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'product' | 'category' | 'coupon';
    id: string;
    title: string;
  } | null>(null);

  // Product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // Category modal state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Coupon modal state
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // Order inspector state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    // If user is not admin, redirect immediately to /admin/login
    if (!isAdmin) {
      onNavigate('admin-login');
      return;
    }
    fetchAllAdminData();
  }, [isAdmin, token]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAllAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [
        statsRes,
        productsRes,
        categoriesRes,
        ordersRes,
        customersRes,
        couponsRes,
        settingsRes,
        emailLogsRes,
      ] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/products', { headers }),
        fetch('/api/categories'),
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/customers', { headers }),
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/settings'),
        fetch('/api/admin/email-logs', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (customersRes.ok) setCustomers(await customersRes.json());
      if (couponsRes.ok) setCoupons(await couponsRes.json());
      if (settingsRes.ok) setStoreSettings(await settingsRes.json());
      if (emailLogsRes.ok) setEmailLogs(await emailLogsRes.json());
      fetchSupabaseStatus();
    } catch (err) {
      console.error('Failed to load admin resources:', err);
    } finally {
      setLoading(false);
    }
  };

  // Supabase states
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    connected: boolean;
    message: string;
    url?: string;
    tableCount?: number;
  } | null>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatus(data);
        if (data.url && !supabaseUrlInput) {
          setSupabaseUrlInput(data.url);
        }
      }
    } catch (e) {
      console.error('Failed to check Supabase status:', e);
    }
  };

  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!supabaseUrlInput || !supabaseKeyInput) {
      alert('Please enter both Supabase Project URL and API Key.');
      return;
    }
    setSupabaseTesting(true);
    try {
      const res = await fetch('/api/supabase/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: supabaseUrlInput.trim(),
          key: supabaseKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Supabase configured!');
        await fetchSupabaseStatus();
      } else {
        alert(data.error || 'Failed to connect to Supabase');
      }
    } catch (err: any) {
      alert(err.message || 'Connection test failed');
    } finally {
      setSupabaseTesting(false);
    }
  };

  const handleSyncToSupabase = async () => {
    if (!token) return;
    setSupabaseSyncing(true);
    try {
      const res = await fetch('/api/supabase/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Catalog synced to Supabase successfully!');
        await fetchSupabaseStatus();
      } else {
        alert(data.error || 'Sync failed');
      }
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setSupabaseSyncing(false);
    }
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Status transition to ${newStatus} authorized by ${user?.name || 'Administrator'}`,
        }),
      });

      if (res.ok) {
        showToast(`Order #${orderId} marked as ${newStatus}.`);
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updated);
        }
        // Refresh stats & products to reflect potential inventory restorations
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then(setStats);
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then(setProducts);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleSaveProduct = async (productData: Product) => {
    if (!token) return;
    const isEdit = !!editingProduct;
    const url = isEdit
      ? `/api/admin/products/${editingProduct.id}`
      : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        showToast(
          isEdit
            ? `Updated "${productData.name}" successfully.`
            : `Created new handbag "${productData.name}".`
        );
        setEditingProduct(null);
        setIsCreatingProduct(false);
        fetchAllAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save product');
      }
    } catch (err: any) {
      alert(err.message || 'Connection error');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm || !token) return;
    const { type, id } = deleteConfirm;

    try {
      let url = '';
      if (type === 'product') url = `/api/admin/products/${id}`;
      else if (type === 'category') url = `/api/admin/categories/${id}`;
      else if (type === 'coupon') url = `/api/admin/coupons/${id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`);
        setDeleteConfirm(null);
        fetchAllAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Delete failed');
      }
    } catch (err: any) {
      alert(err.message || 'Delete operation error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent, cat: Partial<CategoryItem>) => {
    e.preventDefault();
    if (!token || !cat.name) return;
    const isEdit = !!editingCategory;
    const url = isEdit
      ? `/api/admin/categories/${editingCategory.id}`
      : '/api/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cat),
      });
      if (res.ok) {
        showToast(`Category "${cat.name}" saved.`);
        setEditingCategory(null);
        setIsCreatingCategory(false);
        fetchAllAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent, cpn: Partial<Coupon>) => {
    e.preventDefault();
    if (!token || !cpn.code) return;
    const isEdit = !!editingCoupon;
    const url = isEdit
      ? `/api/admin/coupons/${editingCoupon.code}`
      : '/api/admin/coupons';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cpn),
      });
      if (res.ok) {
        showToast(`Promotional code "${cpn.code}" saved.`);
        setEditingCoupon(null);
        setIsCreatingCoupon(false);
        fetchAllAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !storeSettings) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(storeSettings),
      });
      if (res.ok) {
        showToast('Store settings updated.');
        fetchAllAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleAdjustStock = async (
    product: Product,
    variationId: string,
    delta: number
  ) => {
    const v = product.variations.find((item) => item.id === variationId);
    if (!v) return;
    v.stock = Math.max(0, v.stock + delta);
    handleSaveProduct(product);
  };

  // Nav menu items
  const menuItems: { id: AdminSection; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'discounts', label: 'Discounts', icon: Tag },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filtering products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.variations.some((v) => v.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );
  const paginatedProducts = filteredProducts.slice(
    (productPage - 1) * pageSize,
    productPage * pageSize
  );

  // Filtering orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'All' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const match =
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
  const paginatedOrders = filteredOrders.slice(
    (orderPage - 1) * pageSize,
    orderPage * pageSize
  );

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-neutral-900 flex flex-col antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-5 py-3 rounded-lg shadow-2xl text-xs flex items-center gap-2 border border-neutral-700 animate-in slide-in-from-bottom">
          <Check className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-neutral-950 text-white h-16 px-4 sm:px-6 flex items-center justify-between border-b border-neutral-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2A2723] flex items-center justify-center border border-[#3E3A35]">
              <span className="font-serif font-bold text-[#D4AF37] text-sm">L</span>
            </div>
            <span className="font-serif text-lg font-bold tracking-tight text-white hidden sm:inline">
              LuxeCarry
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold bg-[#262421] px-2 py-0.5 rounded border border-[#3E3A35] ml-1">
              Atelier Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={() => onNavigate('home')}
            className="text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span className="hidden sm:inline">Storefront</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-medium hidden sm:inline">
              {user?.name}
            </span>
            <button
              onClick={() => {
                logout();
                onNavigate('home');
              }}
              className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Area: Collapsible Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col bg-[#1E1C1A] text-[#EDE8E1] border-r border-[#2C2926] transition-all duration-300 ${
            sidebarCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Collapse Toggle */}
          <div className="p-3 border-b border-[#2C2926] flex justify-end">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#2B2825] transition-colors"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#D4AF37] text-neutral-950 font-semibold shadow-md'
                      : 'text-neutral-300 hover:bg-[#2B2825] hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Bottom Version */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-[#2C2926] text-[11px] text-neutral-500 font-mono">
              Secure RBAC · Verified Server
            </div>
          )}
        </aside>

        {/* MOBILE DRAWER SIDEBAR */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 bg-[#1E1C1A] text-white flex flex-col p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <span className="font-serif font-bold text-lg text-white">Atelier Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                        isActive
                          ? 'bg-[#D4AF37] text-neutral-950 font-semibold'
                          : 'text-neutral-300 hover:bg-[#2B2825]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* MAIN CONTENT VIEW */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* ========================================================
              SECTION 1: DASHBOARD OVERVIEW
              ======================================================== */}
          {activeSection === 'dashboard' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 tracking-tight">
                  Atelier Executive Overview
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Live database metrics reflecting orders, gross sales, active silhouettes, and inventory health.
                </p>
              </div>

              {/* 5 Top KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block">
                    Total Atelier Revenue
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900 mt-1 block tabular-nums">
                    ${stats ? stats.totalRevenue.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[11px] text-[#2E6838] mt-1 block font-medium">
                    From {stats?.totalOrders ?? 0} total placed orders
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block">
                    Silhouettes & Categories
                  </span>
                  <span className="text-2xl font-serif font-bold text-neutral-900 mt-1 block tabular-nums">
                    {stats?.totalProducts ?? 0} Handbags / {stats?.totalCategories ?? 0} Lines
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    Public active catalog
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block">
                    Fulfillment Pipeline
                  </span>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-[#FFF8E6] text-[#A0612F] font-semibold">
                      {stats?.pendingOrders ?? 0} Pending
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                      {stats?.processingOrders ?? 0} Prep
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                      {stats?.shippedOrders ?? 0} Shipped
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-2 block">
                    {stats?.deliveredOrders ?? 0} delivered, {stats?.cancelledOrders ?? 0} cancelled
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs">
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-500 block">
                    Stock Alerts
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-serif font-bold text-neutral-900 tabular-nums">
                      {stats?.lowStockItems ?? 0}
                    </span>
                    <span className="text-xs text-[#A0522D] font-medium">low stock (&lt; 5)</span>
                  </div>
                  <span className="text-[11px] text-red-600 block mt-1 font-semibold">
                    {stats?.outOfStockItems ?? 0} variations sold out
                  </span>
                </div>
              </div>

              {/* Two Column Section: Recent Orders & Best Selling Products */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Orders */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#EDE8DF] shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
                    <h3 className="text-base font-serif font-semibold text-neutral-900">
                      Recent Customer Orders
                    </h3>
                    <button
                      onClick={() => setActiveSection('orders')}
                      className="text-xs font-semibold text-neutral-900 hover:underline"
                    >
                      View All Orders ({orders.length}) →
                    </button>
                  </div>

                  <div className="divide-y divide-[#F0ECE1]">
                    {orders.slice(0, 5).map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className="py-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF8F5] p-2 rounded-lg transition-colors text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-neutral-900 block">
                            {ord.id}
                          </span>
                          <span className="text-neutral-500">
                            {ord.customer.fullName} · {ord.items.length} item(s)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold tabular-nums text-neutral-900 block">
                            ${ord.totalAmount.toFixed(2)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-800'
                                : ord.status === 'Cancelled'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-[#FFF8E6] text-[#A0612F]'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Selling Silhouettes */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#EDE8DF] shadow-xs space-y-4">
                  <div className="pb-3 border-b border-[#F0ECE1]">
                    <h3 className="text-base font-serif font-semibold text-neutral-900">
                      Best-Selling Silhouettes
                    </h3>
                    <p className="text-xs text-neutral-500">Calculated from order item units</p>
                  </div>

                  <div className="space-y-3">
                    {stats?.bestSellingProducts && stats.bestSellingProducts.length > 0 ? (
                      stats.bestSellingProducts.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EDE8DF] text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-semibold text-neutral-900 block">
                                {p.name}
                              </span>
                              <span className="text-[11px] text-neutral-500">{p.category}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-neutral-900 block tabular-nums">
                              {p.unitsSold} units
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              ${p.revenue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic py-4">
                        Awaiting initial purchase volume for sales ranking.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 2: PRODUCT MANAGEMENT
              ======================================================== */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900">
                    Product Silhouettes ({products.length})
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Manage handcrafted handbags, color-specific image galleries, pricing, and activation.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingProduct(true);
                  }}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Handbag Commission</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="bg-white p-4 rounded-xl border border-[#EDE8DF] flex items-center gap-3">
                <Search className="w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by handbag name, category, or SKU..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setProductPage(1);
                  }}
                  className="w-full text-xs bg-transparent focus:outline-none text-neutral-900 placeholder-neutral-400"
                />
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-neutral-500 uppercase tracking-wider font-semibold border-b border-[#EDE8DF]">
                      <tr>
                        <th className="px-5 py-3.5">Silhouette</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Base Price</th>
                        <th className="px-5 py-3.5">Color Variations</th>
                        <th className="px-5 py-3.5">Total Stock</th>
                        <th className="px-5 py-3.5">Store Visibility</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8DF]">
                      {paginatedProducts.map((p) => {
                        const totalStock = p.variations.reduce((sum, v) => sum + v.stock, 0);
                        const primaryImg = p.variations[0]?.images[0] || '';
                        return (
                          <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="px-5 py-4 flex items-center gap-3">
                              <img
                                src={primaryImg}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-14 object-cover rounded bg-[#F2EDE2] border border-[#DDD5C7]"
                              />
                              <div>
                                <span className="font-semibold text-neutral-900 block text-sm">
                                  {p.name}
                                </span>
                                <span className="text-[11px] text-neutral-400 font-mono">
                                  {p.slug}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-neutral-700 font-medium">
                              {p.category}
                            </td>
                            <td className="px-5 py-4 font-mono font-semibold tabular-nums text-neutral-900">
                              ${p.price.toFixed(2)}
                              {p.salePrice && (
                                <span className="block text-[11px] text-[#8B3A3A] font-normal">
                                  Sale: ${p.salePrice.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                {p.variations.map((v) => (
                                  <span
                                    key={v.id}
                                    className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
                                    style={{ backgroundColor: v.colorCode }}
                                    title={`${v.colorName} (${v.stock} in stock)`}
                                  />
                                ))}
                                <span className="text-[11px] text-neutral-500 ml-1">
                                  ({p.variations.length})
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 font-mono font-medium">
                              {totalStock > 5 ? (
                                <span className="text-[#2E6838]">{totalStock} units</span>
                              ) : totalStock > 0 ? (
                                <span className="text-[#A0522D]">{totalStock} units (Low)</span>
                              ) : (
                                <span className="text-red-600 font-semibold">Sold Out</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => {
                                  const updated = { ...p, active: !p.active };
                                  handleSaveProduct(updated);
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                                  p.active
                                    ? 'bg-[#EBF5EE] text-[#24542B] hover:bg-[#DEEDE1]'
                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                                }`}
                              >
                                {p.active ? 'Active (Live)' : 'Draft (Hidden)'}
                              </button>
                            </td>
                            <td className="px-5 py-4 text-right space-x-2">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded"
                                title="Edit product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'product',
                                    id: p.id,
                                    title: p.name,
                                  })
                                }
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredProducts.length > pageSize && (
                  <div className="p-4 border-t border-[#EDE8DF] flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      Showing {(productPage - 1) * pageSize + 1} to{' '}
                      {Math.min(productPage * pageSize, filteredProducts.length)} of{' '}
                      {filteredProducts.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setProductPage(Math.max(1, productPage - 1))}
                        disabled={productPage === 1}
                        className="px-3 py-1 bg-white border border-[#DDD7CD] rounded disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setProductPage(
                            Math.min(
                              Math.ceil(filteredProducts.length / pageSize),
                              productPage + 1
                            )
                          )
                        }
                        disabled={productPage * pageSize >= filteredProducts.length}
                        className="px-3 py-1 bg-white border border-[#DDD7CD] rounded disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 3: CATEGORIES MANAGEMENT
              ======================================================== */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900">
                    Product Categories ({categories.length})
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Organize handbag silhouettes. Changes appear immediately across navigation and filters.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCreatingCategory(true);
                  }}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-serif font-semibold text-neutral-900">
                          {cat.name}
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                          {cat.slug}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#F0ECE1] flex items-center justify-between">
                      <span className="text-xs text-neutral-600 font-medium">
                        {products.filter((p) => p.category === cat.name).length} products assigned
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({
                              type: 'category',
                              id: cat.id,
                              title: cat.name,
                            })
                          }
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 4: INVENTORY & STOCK MATRIX
              ======================================================== */}
          {activeSection === 'inventory' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-serif font-bold text-neutral-900">
                  Inventory & Stock Matrix
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Color-variation level stock management with atomic decrement protection and quick adjustments.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-xl border border-[#EDE8DF] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search model, color, or SKU..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setInventoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      inventoryFilter === 'all'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-[#DDD7CD] text-neutral-700'
                    }`}
                  >
                    All Items
                  </button>
                  <button
                    onClick={() => setInventoryFilter('low')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      inventoryFilter === 'low'
                        ? 'bg-[#A0522D] text-white'
                        : 'bg-white border border-[#DDD7CD] text-neutral-700'
                    }`}
                  >
                    Low Stock (≤ 5)
                  </button>
                  <button
                    onClick={() => setInventoryFilter('out')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      inventoryFilter === 'out'
                        ? 'bg-red-700 text-white'
                        : 'bg-white border border-[#DDD7CD] text-neutral-700'
                    }`}
                  >
                    Out of Stock (0)
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-neutral-500 uppercase tracking-wider font-semibold border-b border-[#EDE8DF]">
                      <tr>
                        <th className="px-5 py-3.5">Product Model</th>
                        <th className="px-5 py-3.5">Variation Color</th>
                        <th className="px-5 py-3.5">SKU Code</th>
                        <th className="px-5 py-3.5">Unit Price</th>
                        <th className="px-5 py-3.5">Stock Status</th>
                        <th className="px-5 py-3.5 text-right">Quick Stock Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8DF]">
                      {products
                        .flatMap((p) => p.variations.map((v) => ({ product: p, variation: v })))
                        .filter(({ product, variation }) => {
                          if (inventoryFilter === 'low' && (variation.stock > 5 || variation.stock === 0))
                            return false;
                          if (inventoryFilter === 'out' && variation.stock !== 0) return false;
                          if (inventorySearch.trim()) {
                            const q = inventorySearch.toLowerCase();
                            return (
                              product.name.toLowerCase().includes(q) ||
                              variation.colorName.toLowerCase().includes(q) ||
                              variation.sku.toLowerCase().includes(q)
                            );
                          }
                          return true;
                        })
                        .map(({ product, variation }) => {
                          const isZero = variation.stock === 0;
                          const isLow = variation.stock > 0 && variation.stock <= 5;
                          return (
                            <tr
                              key={variation.id}
                              className="hover:bg-[#FAF8F5] transition-colors"
                            >
                              <td className="px-5 py-4 font-semibold text-neutral-900">
                                {product.name}
                              </td>
                              <td className="px-5 py-4 flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
                                  style={{ backgroundColor: variation.colorCode }}
                                />
                                <span>{variation.colorName}</span>
                              </td>
                              <td className="px-5 py-4 font-mono text-[11px] text-neutral-500">
                                {variation.sku}
                              </td>
                              <td className="px-5 py-4 font-mono tabular-nums">
                                ${(variation.salePrice ?? variation.price ?? product.price).toFixed(2)}
                              </td>
                              <td className="px-5 py-4 font-mono font-semibold">
                                {isZero ? (
                                  <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded font-bold">
                                    0 units (Sold Out)
                                  </span>
                                ) : isLow ? (
                                  <span className="text-[#A0522D] bg-[#FFF8E6] px-2 py-0.5 rounded">
                                    {variation.stock} units (Low Stock)
                                  </span>
                                ) : (
                                  <span className="text-[#2E6838]">
                                    {variation.stock} in atelier
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-4 text-right space-x-1.5">
                                <button
                                  onClick={() => handleAdjustStock(product, variation.id, -1)}
                                  className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded hover:bg-neutral-100 text-xs"
                                >
                                  -1
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(product, variation.id, 1)}
                                  className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded hover:bg-neutral-100 text-xs"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => handleAdjustStock(product, variation.id, 5)}
                                  className="px-3 py-1 bg-neutral-900 text-white rounded hover:bg-black text-xs font-semibold"
                                >
                                  +5 Units
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 5: ORDER MANAGEMENT
              ======================================================== */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900">
                    Order Commissions ({orders.length})
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Customer orders, immutable snapshots, and fulfillment lifecycle tracking.
                  </p>
                </div>
              </div>

              {/* Search & Status Filters */}
              <div className="bg-white p-4 rounded-xl border border-[#EDE8DF] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Order ID, Connoisseur, or Email..."
                    value={orderSearch}
                    onChange={(e) => {
                      setOrderSearch(e.target.value);
                      setOrderPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs text-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {[
                    'All',
                    'Pending',
                    'Confirmed',
                    'Processing',
                    'Shipped',
                    'Delivered',
                    'Cancelled',
                  ].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setOrderStatusFilter(st);
                        setOrderPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        orderStatusFilter === st
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border border-[#DDD7CD] text-neutral-700 hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-neutral-500 uppercase tracking-wider font-semibold border-b border-[#EDE8DF]">
                      <tr>
                        <th className="px-5 py-3.5">Order Ref</th>
                        <th className="px-5 py-3.5">Customer / Delivery</th>
                        <th className="px-5 py-3.5">Placed Date</th>
                        <th className="px-5 py-3.5">Snapshot Items</th>
                        <th className="px-5 py-3.5">Total & Payment</th>
                        <th className="px-5 py-3.5">Current Status</th>
                        <th className="px-5 py-3.5 text-right">Transition Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8DF]">
                      {paginatedOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="hover:underline text-left text-neutral-900 flex items-center gap-1.5"
                            >
                              <span>{ord.id}</span>
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-neutral-900 block">
                              {ord.customer.fullName}
                            </span>
                            <span className="text-[11px] text-neutral-500 block">
                              {ord.customer.city}, {ord.customer.country}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-neutral-500">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 max-w-xs">
                            {ord.items.map((it, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 py-0.5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: it.colorCode }}
                                />
                                <span className="truncate">
                                  {it.quantity}x {it.productName} ({it.colorName})
                                </span>
                              </div>
                            ))}
                          </td>
                          <td className="px-5 py-4 font-semibold font-mono text-neutral-900 tabular-nums">
                            ${ord.totalAmount.toFixed(2)}
                            <span className="block text-[10px] text-neutral-400 font-normal">
                              {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : ord.status === 'Cancelled'
                                  ? 'bg-red-50 text-red-700'
                                  : ord.status === 'Shipped'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-[#FFF8E6] text-[#A0612F]'
                              }`}
                            >
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <select
                              value={ord.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  ord.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className="bg-white border border-[#DDD7CD] rounded px-2.5 py-1 text-xs font-medium text-neutral-900 focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredOrders.length > pageSize && (
                  <div className="p-4 border-t border-[#EDE8DF] flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      Showing {(orderPage - 1) * pageSize + 1} to{' '}
                      {Math.min(orderPage * pageSize, filteredOrders.length)} of{' '}
                      {filteredOrders.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrderPage(Math.max(1, orderPage - 1))}
                        disabled={orderPage === 1}
                        className="px-3 py-1 bg-white border border-[#DDD7CD] rounded disabled:opacity-40"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setOrderPage(
                            Math.min(
                              Math.ceil(filteredOrders.length / pageSize),
                              orderPage + 1
                            )
                          )
                        }
                        disabled={orderPage * pageSize >= filteredOrders.length}
                        className="px-3 py-1 bg-white border border-[#DDD7CD] rounded disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 6: CUSTOMER MANAGEMENT
              ======================================================== */}
          {activeSection === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-serif font-bold text-neutral-900">
                  Registered Connoisseurs ({customers.length})
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Client profiles, lifetime order frequency, and aggregate spend.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#EDE8DF] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-neutral-500 uppercase tracking-wider font-semibold border-b border-[#EDE8DF]">
                      <tr>
                        <th className="px-5 py-3.5">Client Name</th>
                        <th className="px-5 py-3.5">Email Contact</th>
                        <th className="px-5 py-3.5">Telephone</th>
                        <th className="px-5 py-3.5">Primary Location</th>
                        <th className="px-5 py-3.5">Total Commissions</th>
                        <th className="px-5 py-3.5 font-mono">Gross Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE8DF]">
                      {customers.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAF8F5]">
                          <td className="px-5 py-4 font-semibold text-neutral-900">
                            {c.name}
                          </td>
                          <td className="px-5 py-4 font-mono text-neutral-600">{c.email}</td>
                          <td className="px-5 py-4 text-neutral-600">{c.phone || '—'}</td>
                          <td className="px-5 py-4 text-neutral-600">
                            {c.address?.city ? `${c.address.city}, ${c.address.country}` : '—'}
                          </td>
                          <td className="px-5 py-4 font-medium tabular-nums">
                            {c.ordersCount} orders
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-neutral-900 tabular-nums">
                            ${c.totalSpent.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 7: DISCOUNTS & PROMOTIONAL PRIVILEGES
              ======================================================== */}
          {activeSection === 'discounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-neutral-900">
                    Discounts & Atelier Privileges ({coupons.length})
                  </h1>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure promotional codes validated in real-time during customer checkout.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    setIsCreatingCoupon(true);
                  }}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Privilege Code</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {coupons.map((cpn) => (
                  <div
                    key={cpn.code}
                    className="bg-white p-5 rounded-2xl border border-[#EDE8DF] shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-lg text-neutral-900 bg-neutral-100 px-3 py-1 rounded-md border border-neutral-200">
                          {cpn.code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                            cpn.active
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {cpn.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-neutral-600 space-y-1">
                        <p className="font-semibold text-neutral-900">
                          {cpn.type === 'percentage'
                            ? `${cpn.value}% Off Entire Bag`
                            : `$${cpn.value} Fixed Deduction`}
                        </p>
                        <p className="text-neutral-500">{cpn.description}</p>
                        <p className="text-[11px] font-mono text-neutral-400">
                          Minimum spend: ${cpn.minSpend}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F0ECE1] flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCoupon(cpn)}
                        className="p-1.5 text-neutral-600 hover:text-black hover:bg-neutral-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'coupon',
                            id: cpn.code,
                            title: cpn.code,
                          })
                        }
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              SECTION 8: STORE SETTINGS
              ======================================================== */}
          {activeSection === 'settings' && storeSettings && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h1 className="text-2xl font-serif font-bold text-neutral-900">
                  Atelier Store Settings
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Shipping costs, free delivery thresholds, and atelier concierge contact points.
                </p>
              </div>

              <form
                onSubmit={handleSaveSettings}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DF] space-y-6 shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                      Standard White-Glove Shipping Fee ($ USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={storeSettings.shippingFee}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          shippingFee: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                      Free Shipping Threshold ($ USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={storeSettings.freeShippingThreshold}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          freeShippingThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                      Atelier Concierge Email
                    </label>
                    <input
                      type="email"
                      required
                      value={storeSettings.storeEmail}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          storeEmail: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                      Telephone Helpline
                    </label>
                    <input
                      type="text"
                      required
                      value={storeSettings.storePhone}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          storePhone: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                    European Atelier Physical Address
                  </label>
                  <input
                    type="text"
                    required
                    value={storeSettings.storeAddress}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        storeAddress: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 text-xs text-neutral-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={storeSettings.codEnabled}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          codEnabled: e.target.checked,
                        })
                      }
                      className="rounded accent-neutral-900 w-4 h-4"
                    />
                    <span>Allow Cash on Delivery (COD) as a Checkout Method</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#EDE8DF] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors"
                  >
                    Save Store Settings
                  </button>
                </div>
              </form>

              {/* Order Screenshot & Email Dispatches Card */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DF] space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE8DF]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center text-[#D4AF37]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-neutral-900">
                          Order Screenshot &amp; Email Dispatches
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#EBF5EE] text-[#24542B]">
                          Automated
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Each new commission automatically captures a high-resolution receipt screenshot and delivers it to the logged-in account email.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchAllAdminData()}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-lg text-xs font-semibold text-neutral-700 hover:bg-[#F2ECE0] flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Refresh Logs</span>
                  </button>
                </div>

                {/* Dispatched Emails List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                    Recent Screenshot Dispatches ({emailLogs.length})
                  </h3>
                  {emailLogs.length === 0 ? (
                    <div className="p-6 text-center bg-[#FAF8F5] rounded-xl border border-[#EDE8DF] text-xs text-neutral-500">
                      No order dispatches recorded yet. When an order is placed from checkout, the captured screenshot and recipient email will appear here immediately.
                    </div>
                  ) : (
                    <div className="border border-[#EDE8DF] rounded-xl overflow-hidden divide-y divide-[#EDE8DF] bg-[#FAF8F5]">
                      {emailLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-white hover:bg-[#FCFBF9]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 shrink-0">
                              <Mail className="w-4 h-4 text-[#D4AF37]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-neutral-900">{log.orderId}</span>
                                <span className="text-neutral-400">→</span>
                                <span className="font-semibold text-neutral-800">{log.recipientEmail}</span>
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                Dispatched {new Date(log.sentAt).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF5EE] text-[#24542B]">
                              {log.status === 'sent' ? 'Live Sent' : 'Dispatched'}
                            </span>
                            {log.screenshotUrl && (
                              <a
                                href={log.screenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 flex items-center gap-1"
                              >
                                <Camera className="w-3 h-3 text-[#D4AF37]" />
                                <span>View Screenshot</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Supabase Cloud Database Integration */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#EDE8DF] space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EDE8DF]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#3ECF8E]/10 flex items-center justify-center text-[#3ECF8E]">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-neutral-900">
                          Supabase Cloud Database
                        </h2>
                        {supabaseStatus?.connected ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#3ECF8E]/20 text-[#147447]">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                            {supabaseStatus?.configured ? 'Verification Needed' : 'Not Connected'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Connect your Supabase project (https://supabase.com) to synchronize products, color variations, stock, and customer orders.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSqlModal(true)}
                      className="px-3.5 py-2 bg-[#FAF8F5] border border-[#DDD7CD] hover:border-black rounded-lg text-xs font-semibold text-neutral-800 flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>SQL Schema</span>
                    </button>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-[#3ECF8E] hover:bg-[#34B27B] text-black font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Supabase Console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Status Indicator Banner */}
                {supabaseStatus && (
                  <div
                    className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                      supabaseStatus.connected
                        ? 'bg-[#3ECF8E]/10 border-[#3ECF8E]/30 text-neutral-800'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="mt-0.5">
                      {supabaseStatus.connected ? (
                        <CheckCircle className="w-4 h-4 text-[#147447]" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">{supabaseStatus.message}</p>
                      {supabaseStatus.url && (
                        <p className="font-mono text-[11px] text-neutral-500">
                          Connected URL: {supabaseStatus.url}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Supabase Connect Form */}
                <form onSubmit={handleConnectSupabase} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Supabase Project URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={supabaseUrlInput}
                        onChange={(e) => setSupabaseUrlInput(e.target.value)}
                        placeholder="https://your-project-id.supabase.co"
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        From Supabase Dashboard → Settings → API → Project URL
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                        Supabase API Key (Anon or Service Role) *
                      </label>
                      <input
                        type="password"
                        required
                        value={supabaseKeyInput}
                        onChange={(e) => setSupabaseKeyInput(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">
                        From Supabase Dashboard → Settings → API → Project API keys
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={fetchSupabaseStatus}
                      className="px-4 py-2 border border-[#DDD7CD] hover:border-black rounded-full text-xs font-semibold text-neutral-700 flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Check Status</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {supabaseStatus?.connected && (
                        <button
                          type="button"
                          onClick={handleSyncToSupabase}
                          disabled={supabaseSyncing}
                          className="px-4 py-2 bg-[#FAF8F5] border border-[#3ECF8E] text-[#147447] hover:bg-[#3ECF8E]/10 rounded-full text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{supabaseSyncing ? 'Syncing...' : 'Sync Catalog to Supabase'}</span>
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={supabaseTesting}
                        className="px-5 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {supabaseTesting ? 'Connecting...' : 'Connect to Supabase'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          MODALS & DRAWERS
          ======================================================== */}

      {/* 1. PRODUCT CREATE / EDIT MODAL */}
      {(editingProduct || isCreatingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setEditingProduct(null);
            setIsCreatingProduct(false);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {/* 2. CATEGORY MODAL */}
      {(editingCategory || isCreatingCategory) && (
        <CategoryModal
          category={editingCategory}
          onClose={() => {
            setEditingCategory(null);
            setIsCreatingCategory(false);
          }}
          onSave={handleSaveCategory}
        />
      )}

      {/* 3. COUPON MODAL */}
      {(editingCoupon || isCreatingCoupon) && (
        <CouponModal
          coupon={editingCoupon}
          onClose={() => {
            setEditingCoupon(null);
            setIsCreatingCoupon(false);
          }}
          onSave={handleSaveCoupon}
        />
      )}

      {/* 4. ORDER INSPECTOR MODAL */}
      {selectedOrder && (
        <OrderInspectorModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
        />
      )}

      {/* 5. CONFIRMATION MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#EDE8DF] space-y-4">
            <h3 className="text-base font-serif font-bold text-neutral-900">
              Confirm Permanent Deletion
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you certain you wish to delete{' '}
              <strong className="text-neutral-900">{deleteConfirm.title}</strong>? This action
              cannot be undone.
            </p>
            <div className="pt-3 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-700 text-white rounded text-xs font-semibold hover:bg-red-800"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUPABASE SQL SCHEMA MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#EDE8DF] space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDE8DF]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#3ECF8E]" />
                <h3 className="text-base font-serif font-bold text-neutral-900">
                  Supabase PostgreSQL Schema Script
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-neutral-600 space-y-2">
              <p>
                To initialize your tables in Supabase, copy the SQL below and paste it into the{' '}
                <a
                  href="https://supabase.com/dashboard/project/_/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-neutral-900 underline inline-flex items-center gap-1"
                >
                  Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-neutral-800">
                  Tables: categories, products, product_variations, orders, order_items, reviews, coupons
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const sql = `-- LuxeCarry PostgreSQL Schema for Supabase
create extension if not exists "uuid-ossp";

create table if not exists public.categories (
    id text primary key,
    name text not null,
    slug text not null unique,
    description text,
    image text,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.products (
    id text primary key,
    name text not null,
    slug text not null unique,
    category text not null,
    price numeric(10, 2) not null,
    sale_price numeric(10, 2),
    description text not null,
    materials text,
    dimensions text,
    care_instructions text,
    featured boolean default false,
    is_new boolean default false,
    is_best_seller boolean default false,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.product_variations (
    id text primary key,
    product_id text references public.products(id) on delete cascade not null,
    color_name text not null,
    color_code text not null,
    sku text not null,
    price numeric(10, 2),
    sale_price numeric(10, 2),
    stock integer default 0 not null,
    images text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.orders (
    id text primary key,
    user_id text,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    shipping_street text not null,
    shipping_city text not null,
    shipping_postal_code text not null,
    shipping_country text not null,
    delivery_instructions text,
    subtotal numeric(10, 2) not null,
    discount_amount numeric(10, 2) default 0 not null,
    coupon_code text,
    shipping_cost numeric(10, 2) default 0 not null,
    total_amount numeric(10, 2) not null,
    payment_method text not null,
    payment_status text default 'Pending' not null,
    status text default 'Pending' not null,
    stock_restored boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
    id uuid default uuid_generate_v4() primary key,
    order_id text references public.orders(id) on delete cascade not null,
    product_id text not null,
    product_name text not null,
    variation_id text not null,
    color_name text not null,
    color_code text not null,
    sku text not null,
    image text not null,
    unit_price numeric(10, 2) not null,
    quantity integer not null,
    subtotal numeric(10, 2) not null
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Allow public read categories" on public.categories for select using (true);
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public read variations" on public.product_variations for select using (true);
create policy "Allow public read orders" on public.orders for select using (true);
create policy "Allow public insert orders" on public.orders for insert with check (true);
create policy "Allow public insert order_items" on public.order_items for insert with check (true);
`;
                    navigator.clipboard.writeText(sql);
                    showToast('SQL Schema copied to clipboard!');
                  }}
                  className="px-3 py-1 bg-[#FAF8F5] border border-[#DDD7CD] hover:border-black rounded-md text-xs font-semibold flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Code</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 bg-[#1A1A1A] text-[#E0E0E0] p-4 rounded-xl text-[11px] font-mono overflow-auto border border-neutral-800 leading-relaxed">
{`-- LuxeCarry Supabase Schema
-- Also saved locally at /supabase/schema.sql

create table if not exists public.products (
    id text primary key,
    name text not null,
    slug text not null unique,
    category text not null,
    price numeric(10, 2) not null,
    sale_price numeric(10, 2),
    description text not null,
    materials text,
    dimensions text,
    care_instructions text,
    featured boolean default false,
    active boolean default true
);

create table if not exists public.product_variations (
    id text primary key,
    product_id text references public.products(id) on delete cascade not null,
    color_name text not null,
    color_code text not null,
    sku text not null,
    price numeric(10, 2),
    sale_price numeric(10, 2),
    stock integer default 0 not null,
    images text[] default '{}'::text[] not null
);

create table if not exists public.orders (
    id text primary key,
    customer_name text not null,
    customer_email text not null,
    subtotal numeric(10, 2) not null,
    total_amount numeric(10, 2) not null,
    status text default 'Pending' not null
);`}
            </pre>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-5 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ========================================================
 * PRODUCT FORM MODAL WITH COLOR VARIATIONS & IMAGE REORDERING
 * ========================================================
 */
interface ProductFormModalProps {
  product: Product | null;
  categories: CategoryItem[];
  onClose: () => void;
  onSave: (product: Product) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(
    product?.category || categories[0]?.name || 'Tote Bags'
  );
  const [price, setPrice] = useState(product?.price || 420);
  const [salePrice, setSalePrice] = useState<number | ''>(
    product?.salePrice !== undefined && product?.salePrice !== null
      ? product.salePrice
      : ''
  );
  const [description, setDescription] = useState(product?.description || '');
  const [materials, setMaterials] = useState(
    product?.materials || '100% Full-grain Tuscan Calfskin, champagne-gold hardware'
  );
  const [dimensions, setDimensions] = useState(
    product?.dimensions || '12.5" W × 9.0" H × 4.5" D'
  );
  const [careInstructions, setCareInstructions] = useState(
    product?.careInstructions || 'Avoid prolonged moisture. Buff lightly with organic leather cream.'
  );
  const [featured, setFeatured] = useState<boolean>(product?.featured || false);
  const [isNew, setIsNew] = useState<boolean>(product?.isNew ?? true);
  const [isBestSeller, setIsBestSeller] = useState<boolean>(product?.isBestSeller || false);
  const [active, setActive] = useState<boolean>(product?.active !== undefined ? product.active : true);

  // Color variations
  const [variations, setVariations] = useState<ProductColorVariation[]>(
    product?.variations || [
      {
        id: `var_${Date.now()}`,
        colorName: 'Saddle Tan',
        colorCode: '#A0612F',
        sku: 'LX-CUSTOM-TAN',
        price: null,
        salePrice: null,
        stock: 10,
        images: ['/src/assets/images/bag_verona_tote_tan_1791892799506.jpg'],
      },
    ]
  );
  const [activeVarIdx, setActiveVarIdx] = useState(0);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddVariation = () => {
    const newVar: ProductColorVariation = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      colorName: 'Midnight Noir',
      colorCode: '#1A1A1A',
      sku: `LX-${name.substring(0, 3).toUpperCase()}-BLK-${variations.length + 1}`,
      price: null,
      salePrice: null,
      stock: 8,
      images: ['/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg'],
    };
    setVariations([...variations, newVar]);
    setActiveVarIdx(variations.length);
  };

  const handleRemoveVariation = (idx: number) => {
    if (variations.length <= 1) {
      alert('A product must retain at least one color variation.');
      return;
    }
    setVariations(variations.filter((_, i) => i !== idx));
    setActiveVarIdx(Math.max(0, activeVarIdx - 1));
  };

  const updateCurrentVar = (fields: Partial<ProductColorVariation>) => {
    const updated = [...variations];
    updated[activeVarIdx] = { ...updated[activeVarIdx], ...fields };
    setVariations(updated);
  };

  // Reorder images
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const imgs = [...variations[activeVarIdx].images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imgs.length) return;
    const temp = imgs[index];
    imgs[index] = imgs[targetIndex];
    imgs[targetIndex] = temp;
    updateCurrentVar({ images: imgs });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('luxecarry_token')}`,
          },
          body: JSON.stringify({ dataUrl, filename: file.name }),
        });

        if (res.ok) {
          const d = await res.json();
          const currentImages = variations[activeVarIdx].images;
          updateCurrentVar({ images: [d.url, ...currentImages] });
        } else {
          alert('Upload failed');
        }
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    updateCurrentVar({ images: [...variations[activeVarIdx].images, newImageUrl.trim()] });
    setNewImageUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Handbag name is required');
      return;
    }
    const payload: Product = {
      id: product?.id || `prod_${Date.now()}`,
      name,
      slug:
        product?.slug ||
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category,
      price: Number(price),
      salePrice: salePrice !== '' ? Number(salePrice) : null,
      description,
      materials,
      dimensions,
      careInstructions,
      featured,
      isNew,
      isBestSeller,
      active,
      variations,
      reviews: product?.reviews || [],
      createdAt: product?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(payload);
  };

  const currentVar = variations[activeVarIdx] || variations[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-[#EDE8DF] space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE8DF]">
          <div>
            <h2 className="text-xl font-serif font-bold text-neutral-900">
              {product ? `Edit "${product.name}"` : 'New Handbag Commission'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Set silhouette attributes, specifications, and variation-specific image sets.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Handbag Model Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Verona Structured Tote"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Base Price ($ USD) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Sale Price ($ USD, Optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={salePrice}
                onChange={(e) =>
                  setSalePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="Leave blank if not discounted"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Materials & Hardware
              </label>
              <input
                type="text"
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Dimensions & Proportions
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-xs"
              />
            </div>
          </div>

          {/* COLOR VARIATIONS MANAGER */}
          <div className="p-5 rounded-2xl bg-[#FAF8F4] border border-[#EAE4D7] space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-3">
              <div>
                <h3 className="text-sm font-serif font-bold text-neutral-900">
                  Color Variations & Galleries ({variations.length})
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Each color has independent stock, images, and SKU code.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariation}
                className="px-3 py-1.5 bg-neutral-900 text-white rounded text-xs font-semibold hover:bg-black flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variation</span>
              </button>
            </div>

            {/* Variation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {variations.map((v, idx) => (
                <button
                  type="button"
                  key={v.id}
                  onClick={() => setActiveVarIdx(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 border transition-all ${
                    activeVarIdx === idx
                      ? 'bg-neutral-900 text-white border-neutral-900 font-semibold'
                      : 'bg-white text-neutral-700 border-[#DDD7CD]'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-neutral-300"
                    style={{ backgroundColor: v.colorCode }}
                  />
                  <span>{v.colorName}</span>
                </button>
              ))}
            </div>

            {/* Active Variation Editor */}
            {currentVar && (
              <div className="bg-white p-4 rounded-xl border border-[#EDE8DF] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">
                    Configuration for: {currentVar.colorName}
                  </span>
                  {variations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(activeVarIdx)}
                      className="text-xs text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Variation</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Color Name
                    </label>
                    <input
                      type="text"
                      required
                      value={currentVar.colorName}
                      onChange={(e) => updateCurrentVar({ colorName: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Hex Swatch
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={currentVar.colorCode}
                        onChange={(e) => updateCurrentVar({ colorCode: e.target.value })}
                        className="w-8 h-8 rounded border p-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={currentVar.colorCode}
                        onChange={(e) => updateCurrentVar({ colorCode: e.target.value })}
                        className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentVar.sku}
                      onChange={(e) => updateCurrentVar({ sku: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={currentVar.stock}
                      onChange={(e) => updateCurrentVar({ stock: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Multiple Images and Reordering */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-2">
                    Images for this Color (Reorder using arrows; #1 is the primary storefront thumbnail)
                  </label>
                  <div className="flex items-center gap-3 overflow-x-auto pb-3">
                    {currentVar.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-24 h-28 rounded-lg overflow-hidden border border-[#DDD5C7] bg-[#F5F2EB] shrink-0 group flex flex-col justify-between"
                      >
                        <img
                          src={img}
                          alt="Variation"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover absolute inset-0"
                        />
                        <div className="relative z-10 p-1 flex justify-between bg-black/40 backdrop-blur-xs text-white">
                          <span className="text-[10px] font-mono font-bold">#{i + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateCurrentVar({
                                images: currentVar.images.filter((_, idx) => idx !== i),
                              })
                            }
                            className="text-red-300 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Move controls */}
                        <div className="relative z-10 p-1 flex justify-around bg-black/50 text-white text-[10px]">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveImage(i, 'up')}
                            className="disabled:opacity-30 p-0.5 hover:text-[#D4AF37]"
                            title="Move Earlier"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={i === currentVar.images.length - 1}
                            onClick={() => moveImage(i, 'down')}
                            className="disabled:opacity-30 p-0.5 hover:text-[#D4AF37]"
                            title="Move Later"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* File Upload Button */}
                    <label className="w-24 h-28 rounded-lg border-2 border-dashed border-[#DDD7CD] hover:border-neutral-900 bg-[#FAF8F5] flex flex-col items-center justify-center cursor-pointer shrink-0">
                      <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                      <span className="text-[10px] text-neutral-600 font-medium">
                        {uploadingImage ? 'Uploading...' : 'Upload File'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {/* Add via URL */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Or enter image URL..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-3 py-1.5 bg-neutral-800 text-white rounded text-xs hover:bg-black"
                    >
                      Add Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visibility and Badges */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-700 pt-2 border-t border-[#EDE7DC]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded accent-neutral-900"
              />
              <span>Active in Public Storefront</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded accent-neutral-900"
              />
              <span>Featured Silhouette</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="rounded accent-neutral-900"
              />
              <span>Best Seller Badge</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isNew}
                onChange={(e) => setIsNew(e.target.checked)}
                className="rounded accent-neutral-900"
              />
              <span>New Arrival Badge</span>
            </label>
          </div>

          <div className="pt-4 border-t border-[#EDE7DC] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-black transition-colors"
            >
              Save Handbag & Variations
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ========================================================
 * CATEGORY MODAL
 * ========================================================
 */
const CategoryModal: React.FC<{
  category: CategoryItem | null;
  onClose: () => void;
  onSave: (e: React.FormEvent, cat: Partial<CategoryItem>) => void;
}> = ({ category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#EDE8DF] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE8DF]">
          <h3 className="text-base font-serif font-bold text-neutral-900">
            {category ? 'Edit Category' : 'New Silhouette Category'}
          </h3>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => onSave(e, { name, description })} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Belt Bags"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md"
            />
          </div>
          <div>
            <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this category line..."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md"
            />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-neutral-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 text-white rounded-full font-semibold hover:bg-black"
            >
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ========================================================
 * COUPON MODAL
 * ========================================================
 */
const CouponModal: React.FC<{
  coupon: Coupon | null;
  onClose: () => void;
  onSave: (e: React.FormEvent, cpn: Partial<Coupon>) => void;
}> = ({ coupon, onClose, onSave }) => {
  const [code, setCode] = useState(coupon?.code || '');
  const [type, setType] = useState<'percentage' | 'fixed'>(coupon?.type || 'percentage');
  const [value, setValue] = useState(coupon?.value || 10);
  const [minSpend, setMinSpend] = useState(coupon?.minSpend || 200);
  const [description, setDescription] = useState(coupon?.description || '');
  const [active, setActive] = useState(coupon?.active !== undefined ? coupon.active : true);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#EDE8DF] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE8DF]">
          <h3 className="text-base font-serif font-bold text-neutral-900">
            {coupon ? 'Edit Privilege Code' : 'New Privilege Code'}
          </h3>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) =>
            onSave(e, {
              code: code.trim().toUpperCase(),
              type,
              value: Number(value),
              minSpend: Number(minSpend),
              description,
              active,
            })
          }
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Privilege Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. LUXE25"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md font-mono uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Discount Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Cash ($)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                required
                min="1"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Minimum Purchase Spend ($ USD)
            </label>
            <input
              type="number"
              min="0"
              value={minSpend}
              onChange={(e) => setMinSpend(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold uppercase tracking-wider text-neutral-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10% off for verified VIP clients"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded accent-neutral-900"
              />
              <span>Active and Valid at Checkout</span>
            </label>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-neutral-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-neutral-900 text-white rounded-full font-semibold hover:bg-black"
            >
              Save Privilege Code
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * ========================================================
 * ORDER INSPECTOR MODAL
 * ========================================================
 */
const OrderInspectorModal: React.FC<{
  order: Order;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}> = ({ order, onClose, onUpdateStatus }) => {
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#EDE8DF] space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#EDE8DF]">
          <div>
            <span className="font-mono font-bold text-lg text-neutral-900 block">
              Commission {order.id}
            </span>
            <span className="text-xs text-neutral-500">
              Placed {new Date(order.createdAt).toLocaleString()}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Address Details */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE8DF] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-900 block">Delivery & Account Recipient</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EBF5EE] text-[#24542B]">
              <Camera className="w-3 h-3" />
              Receipt Screenshot Linked
            </span>
          </div>
          <p className="text-neutral-700 leading-relaxed">
            <strong>{order.customer.fullName}</strong> (<span className="text-[#A37B24] font-medium">{order.customer.email}</span>)<br />
            {order.customer.street}<br />
            {order.customer.city}, {order.customer.postalCode}, {order.customer.country}<br />
            Tel: {order.customer.phone}
          </p>
          {order.customer.deliveryInstructions && (
            <p className="text-[11px] text-neutral-500 italic pt-1">
              Note: "{order.customer.deliveryInstructions}"
            </p>
          )}
          <div className="pt-2 border-t border-[#EDE8DF] flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              {resendStatus ? (
                <span className="text-emerald-700 font-medium">{resendStatus}</span>
              ) : (
                'Order screenshot sent to recipient email upon checkout'
              )}
            </span>
            <button
              type="button"
              disabled={isResending}
              onClick={async () => {
                try {
                  setIsResending(true);
                  setResendStatus('Dispatching screenshot email...');
                  const res = await fetch(`/api/orders/${order.id}/send-screenshot`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${localStorage.getItem('luxecarry_token')}`,
                    },
                    body: JSON.stringify({ recipientEmail: order.customer.email }),
                  });
                  const d = await res.json();
                  setResendStatus(d.message || `Receipt email sent to ${order.customer.email}`);
                } catch (e: any) {
                  setResendStatus(e.message || 'Dispatch error');
                } finally {
                  setIsResending(false);
                }
              }}
              className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded text-[11px] font-semibold text-neutral-800 hover:bg-neutral-50 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3 h-3 text-[#D4AF37]" />
              <span>{isResending ? 'Sending...' : 'Resend Email'}</span>
            </button>
          </div>
        </div>

        {/* Snapshot Items Breakdown */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Commissioned Handbags ({order.items.length})
          </span>
          <div className="space-y-2">
            {order.items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 bg-white border border-[#EDE8DF] rounded-xl text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={it.image}
                    alt={it.productName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-14 object-cover rounded bg-[#F2EDE2] border border-[#DDD5C7]"
                  />
                  <div>
                    <span className="font-semibold text-neutral-900 block">
                      {it.productName}
                    </span>
                    <div className="flex items-center gap-2 text-neutral-500 text-[11px] mt-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-neutral-300"
                        style={{ backgroundColor: it.colorCode }}
                      />
                      <span>{it.colorName}</span>
                      <span>· SKU: {it.sku}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block">Qty: {it.quantity}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    ${it.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="space-y-1.5 text-xs text-neutral-600 pt-4 border-t border-[#EDE8DF]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-[#2E6838]">
              <span>Discount ({order.couponCode})</span>
              <span className="tabular-nums">-${order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>White-Glove Delivery</span>
            <span className="tabular-nums">
              {order.shippingCost === 0 ? 'Complimentary' : `$${order.shippingCost}`}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-[#EDE8DF]">
            <span>Total Commission Due</span>
            <span className="tabular-nums">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Status transition dropdown */}
        <div className="pt-3 border-t border-[#EDE8DF] flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-700">Fulfillment Status:</span>
          <select
            value={order.status}
            onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
            className="bg-neutral-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
};
