import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { db, hashPassword } from './server/db.ts';
import type { Product, OrderStatus, CategoryItem, Coupon, StoreSettings } from './src/types/index.ts';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  syncLocalStoreToSupabase,
  saveSupabaseConfig,
} from './server/supabase.ts';
import { sendOrderReceiptEmail } from './server/emailService.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit for image uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Uploads directory
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Product and brand assets (serves images reliably in both dev and production)
const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), 'src', 'assets', 'images');
if (fs.existsSync(ASSETS_IMAGES_DIR)) {
  app.use('/src/assets/images', express.static(ASSETS_IMAGES_DIR));
  app.use('/assets/images', express.static(ASSETS_IMAGES_DIR));
}

// Simple in-memory session token store (token -> { userId, role, expiresAt })
interface Session {
  userId: string;
  role: 'admin' | 'customer';
  expiresAt: number;
}
const sessions = new Map<string, Session>();

function generateToken(userId: string, role: 'admin' | 'customer'): string {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    role,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

// Authentication middleware
function getAuthSession(req: Request): Session | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  return session;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = getAuthSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  (req as any).session = session;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getAuthSession(req);
  if (!session || session.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  (req as any).session = session;
  next();
}

// ==========================================
// AUTH & ADMIN AUTH ROUTES
// ==========================================

// Public customer registration: NEVER grants admin role
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
    // Strict enforcement: public registration is ALWAYS customer role
    const user = db.createUser({
      name,
      email,
      password,
      role: 'customer',
      phone,
      address,
    });
    const token = generateToken(user.id, user.role);
    return res.status(201).json({ token, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const incomingHash = hashPassword(password);
    if (user.passwordHash !== incomingHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = generateToken(user.id, user.role);
    const { passwordHash, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Dedicated Admin Login Endpoint: Validates Admin Master Passcode (59115911)
app.post('/api/admin/login', (req: Request, res: Response) => {
  try {
    const { password, email } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Admin passcode is required.' });
    }

    const incomingHash = hashPassword(password);
    
    // Find admin user: matches admin role and password hash or passcode 59115911
    let adminUser = email ? db.findUserByEmail(email) : null;
    if (!adminUser) {
      adminUser = db.getUsers().find(
        (u) => u.role === 'admin' && (u.passwordHash === incomingHash || password === '59115911')
      ) || (password === '59115911' ? db.getUsers().find((u) => u.role === 'admin') : null);
    }

    if (!adminUser || (adminUser.passwordHash !== incomingHash && password !== '59115911')) {
      return res.status(401).json({ error: 'Invalid admin passcode. Access denied.' });
    }

    if (adminUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: Account does not possess Administrator privileges.',
      });
    }

    const token = generateToken(adminUser.id, adminUser.role);
    const { passwordHash, ...safeUser } = adminUser;
    return res.json({ token, user: safeUser });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Admin authentication failed' });
  }
});

// Admin Account Setup / Bootstrap
app.post('/api/admin/setup', (req: Request, res: Response) => {
  try {
    const { email, password, name, setupKey } = req.body;
    const existingAdmin = db.findUserByEmail(email);
    if (existingAdmin) {
      return res.json({ message: 'Admin account already configured.', email });
    }
    if (setupKey !== 'LUXE_ATELIER_SECRET_2026') {
      return res.status(403).json({ error: 'Invalid setup verification key.' });
    }
    const newAdmin = db.createUser({
      name: name || 'LuxeCarry Atelier Director',
      email,
      password,
      role: 'admin',
    });
    return res.status(201).json({ message: 'Admin account created successfully.', user: newAdmin });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Setup failed' });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const session = getAuthSession(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.findUserById(session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as Session;
  const { name, phone, address } = req.body;
  const updated = db.updateUserProfile(session.userId, { name, phone, address });
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user: updated });
});

// ==========================================
// STORE SETTINGS & CATEGORIES (PUBLIC & ADMIN)
// ==========================================

app.get('/api/settings', (_req: Request, res: Response) => {
  return res.json(db.getSettings());
});

app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

app.get('/api/categories', (_req: Request, res: Response) => {
  return res.json(db.getCategories());
});

app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, description, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const newCat: CategoryItem = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      description: description || '',
      active: true,
      image: image || '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
    };
    const saved = db.saveCategory(newCat);
    return res.status(201).json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

app.put('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const existing = db.getCategories().find((c) => c.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Category not found' });
    const updated = db.saveCategory({ ...existing, ...req.body, id: existing.id });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = db.deleteCategory(req.params.id);
    if (!success) return res.status(404).json({ error: 'Category not found' });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
});

// ==========================================
// STOREFRONT PRODUCTS API
// ==========================================

app.get('/api/products', (req: Request, res: Response) => {
  try {
    let products = db.getProducts();

    const session = getAuthSession(req);
    const isAdmin = session?.role === 'admin';
    if (!isAdmin) {
      products = products.filter((p) => p.active !== false);
    }

    const { category, search, color, sort, minPrice, maxPrice, featured } = req.query;

    if (category && category !== 'All') {
      products = products.filter(
        (p) => p.category.toLowerCase() === String(category).toLowerCase()
      );
    }

    if (featured === 'true') {
      products = products.filter((p) => p.featured || p.isBestSeller);
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.materials.toLowerCase().includes(q)
      );
    }

    if (color && String(color).trim()) {
      const c = String(color).toLowerCase().trim();
      products = products.filter((p) =>
        p.variations.some((v) => v.colorName.toLowerCase().includes(c))
      );
    }

    if (minPrice) {
      const min = parseFloat(String(minPrice));
      if (!isNaN(min)) {
        products = products.filter((p) => (p.salePrice ?? p.price) >= min);
      }
    }

    if (maxPrice) {
      const max = parseFloat(String(maxPrice));
      if (!isNaN(max)) {
        products = products.filter((p) => (p.salePrice ?? p.price) <= max);
      }
    }

    if (sort) {
      switch (sort) {
        case 'price-asc':
          products.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
          break;
        case 'price-desc':
          products.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
          break;
        case 'name-asc':
          products.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'newest':
        default:
          products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }
    }

    return res.json(products);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json(product);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch product' });
  }
});

app.post('/api/products/:id/reviews', (req: Request, res: Response) => {
  try {
    const { author, rating, comment } = req.body;
    if (!author || !rating || !comment) {
      return res.status(400).json({ error: 'Author, rating, and review text are required.' });
    }
    const updated = db.addProductReview(req.params.id, { author, rating: Number(rating), comment });
    if (!updated) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.status(201).json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to post review' });
  }
});

// ==========================================
// COUPON & CART VALIDATION (PUBLIC & ADMIN)
// ==========================================

app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, subtotal } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Coupon code required.' });
  }
  const result = db.validateCoupon(code, Number(subtotal) || 0);
  if (!result.valid) {
    return res.status(400).json({ error: result.message });
  }
  return res.json({ coupon: result.coupon, discount: result.discount });
});

app.get('/api/admin/coupons', requireAdmin, (_req: Request, res: Response) => {
  return res.json(db.getCoupons());
});

app.post('/api/admin/coupons', requireAdmin, (req: Request, res: Response) => {
  try {
    const { code, type, value, minSpend, description, active } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'Code, type, and value are required.' });
    }
    const newCoupon: Coupon = {
      code: code.trim().toUpperCase(),
      type: type === 'fixed' ? 'fixed' : 'percentage',
      value: Number(value),
      minSpend: Number(minSpend) || 0,
      description: description || '',
      active: active !== undefined ? active : true,
    };
    const saved = db.saveCoupon(newCoupon);
    return res.status(201).json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create coupon' });
  }
});

app.put('/api/admin/coupons/:code', requireAdmin, (req: Request, res: Response) => {
  try {
    const saved = db.saveCoupon(req.body);
    return res.json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update coupon' });
  }
});

app.delete('/api/admin/coupons/:code', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = db.deleteCoupon(req.params.code);
    if (!success) return res.status(404).json({ error: 'Coupon not found.' });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete coupon' });
  }
});

// ==========================================
// ORDERS & CHECKOUT API
// ==========================================

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const { customer, items, couponCode, paymentMethod } = req.body;

    if (!customer || !customer.fullName || !customer.email || !customer.phone || !customer.street || !customer.city || !customer.postalCode) {
      return res.status(400).json({ error: 'Please provide all mandatory customer and delivery details.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your shopping bag is empty.' });
    }

    const session = getAuthSession(req);
    const result = db.placeOrder({
      userId: session?.userId || null,
      customer,
      items,
      couponCode,
      paymentMethod: paymentMethod === 'CARD' ? 'CARD' : 'COD',
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json({ order: result.order });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to process order' });
  }
});

app.get('/api/orders/my-orders', requireAuth, (req: Request, res: Response) => {
  const session = (req as any).session as Session;
  const userOrders = db.getOrdersByUserId(session.userId);
  return res.json(userOrders);
});

app.get('/api/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  return res.json(order);
});

// Endpoint to send order screenshot to logged-in user's email
app.post('/api/orders/:id/send-screenshot', async (req: Request, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const { screenshotBase64, recipientEmail: customRecipient } = req.body;

    // Strict priority: The email of the person who is logged in
    let targetEmail = '';

    const session = getAuthSession(req);
    if (session) {
      const loggedInUser = db.findUserById(session.userId);
      if (loggedInUser && loggedInUser.email) {
        targetEmail = loggedInUser.email;
      }
    }

    if (!targetEmail && order.userId) {
      const orderUser = db.findUserById(order.userId);
      if (orderUser && orderUser.email) {
        targetEmail = orderUser.email;
      }
    }

    if (!targetEmail) {
      targetEmail = customRecipient || order.customer?.email;
    }

    if (!targetEmail) {
      return res.status(400).json({ error: 'No logged-in user or recipient email found for this order.' });
    }

    const result = await sendOrderReceiptEmail({
      order,
      recipientEmail: targetEmail,
      screenshotBase64,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Failed to send order screenshot email:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
});

app.get('/api/admin/email-logs', requireAdmin, (_req: Request, res: Response) => {
  try {
    const logs = db.getEmailLogs();
    return res.json(logs);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve email logs' });
  }
});

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT API
// ==========================================

app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  try {
    const stats = db.getAdminStats();
    return res.json(stats);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to calculate statistics' });
  }
});

app.get('/api/admin/customers', requireAdmin, (_req: Request, res: Response) => {
  try {
    const customers = db.getCustomers();
    return res.json(customers);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch customers' });
  }
});

app.get('/api/admin/orders', requireAdmin, (req: Request, res: Response) => {
  try {
    let orders = db.getOrders();
    const { status, search } = req.query;

    if (status && status !== 'All') {
      orders = orders.filter((o) => o.status === status);
    }

    if (search && String(search).trim()) {
      const q = String(search).toLowerCase().trim();
      orders = orders.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.fullName.toLowerCase().includes(q) ||
          o.customer.email.toLowerCase().includes(q) ||
          o.customer.phone.toLowerCase().includes(q) ||
          o.items.some((i) => i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
      );
    }

    return res.json(orders);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve orders' });
  }
});

app.patch('/api/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const validStatuses: OrderStatus[] = [
      'Pending',
      'Confirmed',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status transition.' });
    }

    const updated = db.updateOrderStatus(req.params.id, status, note);
    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update order status' });
  }
});

app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
  try {
    const productData = req.body as Product;
    if (!productData.name || !productData.category || !productData.price) {
      return res.status(400).json({ error: 'Name, category, and base price are required.' });
    }
    if (!productData.variations || productData.variations.length === 0) {
      return res.status(400).json({ error: 'At least one color variation is required.' });
    }

    const id = productData.id || `prod_${Date.now()}`;
    const slug =
      productData.slug ||
      productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const newProduct: Product = {
      ...productData,
      id,
      slug,
      active: productData.active !== undefined ? productData.active : true,
      reviews: productData.reviews || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveProduct(newProduct);
    return res.status(201).json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const existing = db.getProductById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const productData = req.body as Product;
    const updated: Product = {
      ...existing,
      ...productData,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    const saved = db.saveProduct(updated);
    return res.json(saved);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    return res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// Admin Image Upload (Accepts base64 data URLs or binary file upload)
app.post('/api/admin/upload', requireAdmin, (req: Request, res: Response) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ error: 'Image data URL required.' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid data URL format.' });
    }

    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const safeName = `bag_upload_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${safeName}`;

    return res.json({ url: publicUrl, filename: safeName });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// ==========================================
// SUPABASE INTEGRATION ROUTES
// ==========================================

// Check Supabase connection status
app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  try {
    const status = await testSupabaseConnection();
    return res.json({
      configured: isSupabaseConfigured(),
      ...status,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Supabase check failed' });
  }
});

// Update Supabase configuration dynamically (admin only)
app.post('/api/supabase/configure', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: 'Supabase URL and Key are required.' });
    }

    if (!url.startsWith('https://')) {
      return res.status(400).json({ error: 'Supabase URL must start with https://' });
    }

    // Set environment variables and persist to disk
    saveSupabaseConfig(url, key);
    process.env.SUPABASE_URL = url;
    process.env.SUPABASE_ANON_KEY = key;
    process.env.VITE_SUPABASE_URL = url;
    process.env.VITE_SUPABASE_ANON_KEY = key;

    // Test the new connection
    const testResult = await testSupabaseConnection(url, key);
    return res.json({
      success: testResult.connected,
      message: testResult.message,
      url,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Configuration failed' });
  }
});

// Trigger sync from local database to Supabase (admin only)
app.post('/api/supabase/sync', requireAdmin, async (_req: Request, res: Response) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(400).json({
        error: 'Supabase is not configured. Please provide your Supabase URL and Key.',
      });
    }

    const result = await syncLocalStoreToSupabase();
    return res.json({
      success: result.success,
      message: `Synced ${result.syncedProducts} products and ${result.syncedCategories} categories to Supabase!`,
      syncedProducts: result.syncedProducts,
      syncedCategories: result.syncedCategories,
      errors: result.errors,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Sync failed' });
  }
});

// ==========================================
// VITE OR STATIC FRONTEND INTEGRATION
// ==========================================

async function startServer() {
  if (!isProd) {
    const viteModule = await import('vite');
    const vite = await viteModule.createServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ LuxeCarry full-stack server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
