import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  Product,
  Order,
  User,
  Coupon,
  AdminStats,
  CategoryItem,
  StoreSettings,
  CustomerSummary,
  EmailNotificationLog,
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  products: Product[];
  orders: Order[];
  coupons: Coupon[];
  categories: CategoryItem[];
  settings: StoreSettings;
  emailLogs?: EmailNotificationLog[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_luxecarry_salt').digest('hex');
}

const initialSeedData: DatabaseSchema = {
  settings: {
    shippingFee: 25,
    freeShippingThreshold: 300,
    storeEmail: 'concierge@luxecarry.com',
    storePhone: '+1 (555) 019-2834',
    storeAddress: "Via de' Tornabuoni, 14, 50123 Firenze FI, Italy",
    codEnabled: true,
  },
  categories: [
    {
      id: 'cat_totes',
      name: 'Tote Bags',
      slug: 'tote-bags',
      description: 'Structured everyday silhouettes handcrafted from full-grain Tuscan calfskin.',
      active: true,
      image: '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
    },
    {
      id: 'cat_shoulder',
      name: 'Shoulder Bags',
      slug: 'shoulder-bags',
      description: 'Graceful feminine curves with solid gourmette link brass chains.',
      active: true,
      image: '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
    },
    {
      id: 'cat_crossbody',
      name: 'Crossbody Bags',
      slug: 'crossbody-bags',
      description: 'Versatile hands-free architecture with iconic turnlock closures.',
      active: true,
      image: '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
    },
    {
      id: 'cat_clutches',
      name: 'Clutches',
      slug: 'clutches',
      description: 'Sculptural evening minaudières and embossed alligator-grain leatherpieces.',
      active: true,
      image: '/src/assets/images/bag_elysee_clutch_emerald_1791892800669.jpg',
    },
    {
      id: 'cat_backpacks',
      name: 'Backpacks',
      slug: 'backpacks',
      description: 'Streamlined luxury leather backpacks for executive day-to-day transit.',
      active: true,
      image: '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
    },
    {
      id: 'cat_mini',
      name: 'Mini Bags',
      slug: 'mini-bags',
      description: 'Chic miniature statement sculptures with delicate top handles and straps.',
      active: true,
      image: '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
    },
  ],
  users: [
    {
      id: 'usr_admin_1',
      name: 'Eleanor Vance',
      email: 'admin@luxecarry.com',
      passwordHash: hashPassword('59115911'),
      role: 'admin',
      phone: '+1 (555) 019-2834',
      address: {
        fullName: 'Eleanor Vance',
        email: 'admin@luxecarry.com',
        phone: '+1 (555) 019-2834',
        street: '740 Park Avenue, Suite 12B',
        city: 'New York',
        postalCode: '10021',
        country: 'United States',
      },
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 'usr_cust_1',
      name: 'Claire Dupont',
      email: 'claire@example.com',
      passwordHash: hashPassword('Customer123!'),
      role: 'customer',
      phone: '+1 (555) 839-4412',
      address: {
        fullName: 'Claire Dupont',
        email: 'claire@example.com',
        phone: '+1 (555) 839-4412',
        street: '280 Rue Saint-Honoré',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
      },
      createdAt: '2026-02-10T14:30:00.000Z',
    },
    {
      id: 'usr_cust_2',
      name: 'Vivienne Delacroix',
      email: 'vivienne@example.com',
      passwordHash: hashPassword('Customer123!'),
      role: 'customer',
      phone: '+44 20 7946 0912',
      address: {
        fullName: 'Vivienne Delacroix',
        email: 'vivienne@example.com',
        phone: '+44 20 7946 0912',
        street: '14 Mayfair Crescent',
        city: 'London',
        postalCode: 'W1J 8AJ',
        country: 'United Kingdom',
      },
      createdAt: '2026-02-22T11:00:00.000Z',
    },
    {
      id: 'usr_cust_3',
      name: 'Member',
      email: 'ra2826572@gmail.com',
      passwordHash: hashPassword('59115911'),
      role: 'customer',
      phone: '+1 (555) 012-3456',
      address: {
        fullName: 'Member',
        email: 'ra2826572@gmail.com',
        phone: '+1 (555) 012-3456',
        street: '100 Luxury Way',
        city: 'London',
        postalCode: 'W1K 6ZA',
        country: 'United Kingdom',
      },
      createdAt: '2026-03-01T10:00:00.000Z',
    },
  ],
  coupons: [
    {
      code: 'LUXE10',
      type: 'percentage',
      value: 10,
      minSpend: 200,
      active: true,
      description: '10% privilege discount on commissions over $200',
    },
    {
      code: 'WELCOME50',
      type: 'fixed',
      value: 50,
      minSpend: 350,
      active: true,
      description: '$50 off your premier purchase over $350',
    },
    {
      code: 'VIP15',
      type: 'percentage',
      value: 15,
      minSpend: 500,
      active: true,
      description: '15% VIP atelier privilege on orders over $500',
    },
  ],
  products: [
    {
      id: 'prod_1791896396803',
      name: 'The Roma Trapeze Bag',
      slug: 'the-roma-trapeze-bag',
      category: 'Shoulder Bags',
      price: 530,
      salePrice: null,
      description: 'Sculptural trapeze silhouette with beveled leather gussets and signature brushed champagne-gold rotary clasp.',
      materials: 'Hand-buffed box calfskin, champagne gold turnlock, bonded suede interior.',
      dimensions: '11" W x 8" H x 4" D',
      careInstructions: 'Store in dust bag away from damp and direct heat.',
      featured: true,
      isNew: true,
      isBestSeller: true,
      active: true,
      variations: [
        {
          id: 'var_roma_champagne',
          colorName: 'Champagne Beige',
          colorCode: '#E6D7C3',
          sku: 'LX-RMA-CHM-01',
          price: 530,
          salePrice: null,
          stock: 22,
          images: [
            '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
          ],
        },
      ],
      reviews: [],
      createdAt: '2026-10-14T10:43:03.825Z',
      updatedAt: '2026-10-14T11:12:46.068Z',
    },
    {
      id: 'prod_verona_tote',
      name: 'The Verona Structured Tote',
      slug: 'verona-structured-tote',
      category: 'Tote Bags',
      price: 495,
      salePrice: 445,
      description: 'Architecturally proportioned and handcrafted in Florence from vegetable-tanned Italian saddle calfskin. Featuring reinforced rolled top handles, an optional crossbody strap, and polished champagne-gold buckle accents.',
      materials: '100% Full-grain Tuscan Calfskin, Champagne-gold plated brass hardware, bonded suede lining.',
      dimensions: '14.5" W × 10.8" H × 5.8" D • Handle Drop: 5.5" • Detachable Strap: 18"–22"',
      careInstructions: 'Avoid prolonged exposure to direct sunlight and moisture. Buff lightly with an organic leather cream twice annually.',
      featured: true,
      isNew: true,
      isBestSeller: true,
      active: true,
      variations: [
        {
          id: 'var_verona_tan',
          colorName: 'Saddle Tan',
          colorCode: '#A0612F',
          sku: 'LX-VRT-TAN-01',
          price: 495,
          salePrice: 445,
          stock: 14,
          images: [
            '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
        {
          id: 'var_verona_black',
          colorName: 'Midnight Noir',
          colorCode: '#1A1A1A',
          sku: 'LX-VRT-BLK-02',
          price: 495,
          salePrice: 445,
          stock: 8,
          images: [
            '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
        {
          id: 'var_verona_cream',
          colorName: 'Alabaster Ivory',
          colorCode: '#EFECE6',
          sku: 'LX-VRT-IVR-03',
          price: 520,
          salePrice: null,
          stock: 5,
          images: [
            '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
      ],
      reviews: [
        {
          id: 'rev_1',
          author: 'Camille R.',
          rating: 5,
          date: '2026-03-02',
          comment: 'The craftsmanship on the Saddle Tan is breathtaking. Holds a 14" laptop effortlessly without losing its structured silhouette.',
          verifiedPurchase: true,
        },
        {
          id: 'rev_2',
          author: 'Genevieve M.',
          rating: 5,
          date: '2026-02-18',
          comment: 'Arrived packaged like high jewellery in a double dust bag. The leather smells divine.',
          verifiedPurchase: true,
        },
      ],
      createdAt: '2026-01-20T12:00:00.000Z',
      updatedAt: '2026-03-10T12:00:00.000Z',
    },
    {
      id: 'prod_monaco_crossbody',
      name: 'The Monaco Flap Crossbody',
      slug: 'monaco-flap-crossbody',
      category: 'Crossbody Bags',
      price: 380,
      salePrice: null,
      description: 'A sharp, sculptural day-to-evening crossbody with accordion gussets, interior card slips, and our iconic signature rotary turnlock in satin champagne gold.',
      materials: 'Hand-buffed smooth box calfskin, brushed custom alloy lock, bonded lambskin interior.',
      dimensions: '9.2" W × 6.8" H × 3.2" D • Adjustable Strap Drop: 19"–23"',
      careInstructions: 'Store in complimentary cotton flannel dust bag. Wipe gently with dry microfiber cloth.',
      featured: true,
      isNew: false,
      isBestSeller: true,
      active: true,
      variations: [
        {
          id: 'var_monaco_black',
          colorName: 'Onyx Black',
          colorCode: '#111111',
          sku: 'LX-MNC-BLK-01',
          price: 380,
          salePrice: null,
          stock: 12,
          images: [
            '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
        {
          id: 'var_monaco_emerald',
          colorName: 'Empire Emerald',
          colorCode: '#133E2B',
          sku: 'LX-MNC-EMR-02',
          price: 410,
          salePrice: 380,
          stock: 6,
          images: [
            '/src/assets/images/bag_elysee_clutch_emerald_1791892800669.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
        {
          id: 'var_monaco_tan',
          colorName: 'Cognac Saddle',
          colorCode: '#8B4513',
          sku: 'LX-MNC-CGN-03',
          price: 380,
          salePrice: null,
          stock: 0,
          images: [
            '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
          ],
        },
      ],
      reviews: [
        {
          id: 'rev_3',
          author: 'Victoria S.',
          rating: 5,
          date: '2026-03-12',
          comment: 'The turnlock mechanism has such a satisfying click. Pure quiet luxury.',
          verifiedPurchase: true,
        },
      ],
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-03-11T10:00:00.000Z',
    },
    {
      id: 'prod_sorrento_shoulder',
      name: 'The Sorrento Chain Shoulder Bag',
      slug: 'sorrento-chain-shoulder-bag',
      category: 'Shoulder Bags',
      price: 440,
      salePrice: 395,
      description: 'Defined by feminine curves and a supple semi-structured silhouette, the Sorrento features hand-interwoven gourmette curb chain and a sculptural arch lock.',
      materials: 'Supple Napa leather, solid brass curb link chain strap, interior zippered partition.',
      dimensions: '10.5" W × 7.2" H × 3.5" D • Doubled Chain Drop: 11" • Single Strap Drop: 20"',
      careInstructions: 'Keep away from alcohol-based hand sanitizers and perfumes.',
      featured: true,
      isNew: true,
      isBestSeller: false,
      active: true,
      variations: [
        {
          id: 'var_sorrento_cream',
          colorName: 'Crema Nuvola',
          colorCode: '#F4EFE6',
          sku: 'LX-SRN-CRM-01',
          price: 440,
          salePrice: 395,
          stock: 10,
          images: [
            '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
            '/src/assets/images/hero_luxe_carry_1791892799388.jpg',
          ],
        },
        {
          id: 'var_sorrento_tan',
          colorName: 'Tuscan Tan',
          colorCode: '#A56534',
          sku: 'LX-SRN-TAN-02',
          price: 440,
          salePrice: 395,
          stock: 7,
          images: [
            '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
          ],
        },
        {
          id: 'var_sorrento_black',
          colorName: 'Caviar Black',
          colorCode: '#151515',
          sku: 'LX-SRN-BLK-03',
          price: 440,
          salePrice: null,
          stock: 4,
          images: [
            '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
          ],
        },
      ],
      reviews: [
        {
          id: 'rev_4',
          author: 'Sophia L.',
          rating: 5,
          date: '2026-03-24',
          comment: 'Wore it to an opera gala and got constant compliments. The chain has substantial weight.',
          verifiedPurchase: true,
        },
      ],
      createdAt: '2026-02-15T09:00:00.000Z',
      updatedAt: '2026-03-12T09:00:00.000Z',
    },
    {
      id: 'prod_elysee_clutch',
      name: 'The Élysée Croc Evening Clutch',
      slug: 'elysee-croc-evening-clutch',
      category: 'Clutches',
      price: 320,
      salePrice: null,
      description: 'An elongated evening minaudière crafted from richly embossed alligator-grain calfskin with beveled edges and a removable delicate serpent chain for shoulder carry.',
      materials: 'Embossed alligator-effect calfskin, polished brass monogram lock, silk satin lining.',
      dimensions: '8.8" W × 4.8" H × 2.0" D • Detachable Drop Chain: 22"',
      careInstructions: 'Store in protective felt pouch. Protect from heat and open flame.',
      featured: true,
      isNew: false,
      isBestSeller: true,
      active: true,
      variations: [
        {
          id: 'var_elysee_emerald',
          colorName: 'Forest Emerald',
          colorCode: '#10452C',
          sku: 'LX-ELY-EMR-01',
          price: 320,
          salePrice: null,
          stock: 9,
          images: [
            '/src/assets/images/bag_elysee_clutch_emerald_1791892800669.jpg',
          ],
        },
        {
          id: 'var_elysee_black',
          colorName: 'Patent Noir',
          colorCode: '#0D0D0D',
          sku: 'LX-ELY-BLK-02',
          price: 320,
          salePrice: null,
          stock: 11,
          images: [
            '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
          ],
        },
        {
          id: 'var_elysee_ivory',
          colorName: 'Pearl White',
          colorCode: '#FAF8F5',
          sku: 'LX-ELY-IVR-03',
          price: 340,
          salePrice: null,
          stock: 3,
          images: [
            '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
          ],
        },
      ],
      reviews: [
        {
          id: 'rev_5',
          author: 'Astrid B.',
          rating: 5,
          date: '2026-03-30',
          comment: 'Fits the latest iPhone Pro Max, a compact, lipstick, and cards effortlessly. Absolutely stunning glaze.',
          verifiedPurchase: true,
        },
      ],
      createdAt: '2026-02-20T11:00:00.000Z',
      updatedAt: '2026-03-14T11:00:00.000Z',
    },
    {
      id: 'prod_geneva_backpack',
      name: 'The Geneva City Leather Backpack',
      slug: 'geneva-city-leather-backpack',
      category: 'Backpacks',
      price: 460,
      salePrice: 410,
      description: 'Streamlined luxury backpack designed for the modern executive. Features padded tablet compartment, discreet back security pocket, and padded leather shoulder straps.',
      materials: 'Water-resistant pebbled Italian leather, palladium-finish zippers, microfiber lining.',
      dimensions: '11.5" W × 14.0" H × 5.2" D • Fits up to 13" laptop/tablet',
      careInstructions: 'Clean with damp microfiber cloth. Store stuffed with tissue paper.',
      featured: false,
      isNew: true,
      isBestSeller: false,
      active: true,
      variations: [
        {
          id: 'var_geneva_black',
          colorName: 'Jet Black Pebble',
          colorCode: '#1A1A1A',
          sku: 'LX-GNV-BLK-01',
          price: 460,
          salePrice: 410,
          stock: 6,
          images: [
            '/src/assets/images/bag_monaco_crossbody_black_1791892801456.jpg',
          ],
        },
        {
          id: 'var_geneva_tan',
          colorName: 'Biscotti Tan',
          colorCode: '#985B28',
          sku: 'LX-GNV-TAN-02',
          price: 460,
          salePrice: 410,
          stock: 5,
          images: [
            '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
          ],
        },
      ],
      reviews: [],
      createdAt: '2026-03-01T15:00:00.000Z',
      updatedAt: '2026-03-15T15:00:00.000Z',
    },
    {
      id: 'prod_capri_mini',
      name: 'The Capri Sculpted Mini Bag',
      slug: 'capri-sculpted-mini-bag',
      category: 'Mini Bags',
      price: 290,
      salePrice: null,
      description: 'A charming miniature statement piece with rigid top handle and detachable slender crossbody strap. Perfect for chic minimalist outings.',
      materials: 'Smooth calfskin leather, magnetic tab closure, gold-finish hardware.',
      dimensions: '6.8" W × 5.2" H × 2.6" D • Handle Drop: 2.8" • Crossbody Strap: 21"',
      careInstructions: 'Protect from sharp objects. Store away from sunlight.',
      featured: false,
      isNew: true,
      isBestSeller: false,
      active: true,
      variations: [
        {
          id: 'var_capri_cream',
          colorName: 'Butter Cream',
          colorCode: '#F8F3E6',
          sku: 'LX-CPR-CRM-01',
          price: 290,
          salePrice: null,
          stock: 8,
          images: [
            '/src/assets/images/bag_sorrento_shoulder_cream_1791892800612.jpg',
          ],
        },
        {
          id: 'var_capri_emerald',
          colorName: 'Malachite Green',
          colorCode: '#154A36',
          sku: 'LX-CPR-MLC-02',
          price: 290,
          salePrice: null,
          stock: 4,
          images: [
            '/src/assets/images/bag_elysee_clutch_emerald_1791892800669.jpg',
          ],
        },
      ],
      reviews: [],
      createdAt: '2026-03-05T12:00:00.000Z',
      updatedAt: '2026-03-15T12:00:00.000Z',
    },
  ],
  orders: [
    {
      id: 'ORD-2026-1042',
      userId: 'usr_cust_1',
      customer: {
        fullName: 'Claire Dupont',
        email: 'claire@example.com',
        phone: '+1 (555) 839-4412',
        street: '280 Rue Saint-Honoré',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        deliveryInstructions: 'Ring bell #4, concierge available 9am-6pm',
      },
      items: [
        {
          productId: 'prod_verona_tote',
          productName: 'The Verona Structured Tote',
          variationId: 'var_verona_tan',
          colorName: 'Saddle Tan',
          colorCode: '#A0612F',
          sku: 'LX-VRT-TAN-01',
          image: '/src/assets/images/bag_verona_tote_tan_1791892799506.jpg',
          unitPrice: 445,
          quantity: 1,
          subtotal: 445,
        },
      ],
      subtotal: 445,
      discountAmount: 44.5,
      couponCode: 'LUXE10',
      shippingCost: 0,
      totalAmount: 400.5,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      status: 'Processing',
      stockRestored: false,
      statusHistory: [
        {
          status: 'Pending',
          date: '2026-03-10T14:35:00.000Z',
          note: 'Order placed by customer via Cash on Delivery.',
        },
        {
          status: 'Confirmed',
          date: '2026-03-10T15:00:00.000Z',
          note: 'Order verified by atelier fulfillment.',
        },
        {
          status: 'Processing',
          date: '2026-03-11T09:30:00.000Z',
          note: 'Preparing custom monogramming and luxury presentation gift box.',
        },
      ],
      createdAt: '2026-03-10T14:35:00.000Z',
      updatedAt: '2026-03-11T09:30:00.000Z',
    },
  ],
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.readFromDisk();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private readFromDisk(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.products && parsed.orders && parsed.users) {
          // Ensure new fields are present if loaded from existing file
          if (!parsed.categories) parsed.categories = initialSeedData.categories;
          if (!parsed.settings) parsed.settings = initialSeedData.settings;
          if (!parsed.emailLogs) parsed.emailLogs = [];
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading database file, resetting to initial seed:', e);
    }
    this.writeToDisk(initialSeedData);
    return initialSeedData;
  }

  private writeToDisk(data: DatabaseSchema) {
    this.ensureDataDir();
    const tempPath = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  }

  // ===================
  // PRODUCTS
  // ===================
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id || p.slug === id);
  }

  public saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    product.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      product.createdAt = new Date().toISOString();
      this.data.products.unshift(product);
    }
    this.writeToDisk(this.data);
    return product;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.writeToDisk(this.data);
      return true;
    }
    return false;
  }

  // ===================
  // CATEGORIES
  // ===================
  public getCategories(): CategoryItem[] {
    return this.data.categories;
  }

  public saveCategory(category: CategoryItem): CategoryItem {
    const idx = this.data.categories.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      this.data.categories[idx] = category;
    } else {
      this.data.categories.push(category);
    }
    this.writeToDisk(this.data);
    return category;
  }

  public deleteCategory(id: string): boolean {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== initialLen) {
      this.writeToDisk(this.data);
      return true;
    }
    return false;
  }

  // ===================
  // STORE SETTINGS
  // ===================
  public getSettings(): StoreSettings {
    return this.data.settings || initialSeedData.settings;
  }

  public updateSettings(settings: Partial<StoreSettings>): StoreSettings {
    this.data.settings = {
      ...(this.data.settings || initialSeedData.settings),
      ...settings,
    };
    this.writeToDisk(this.data);
    return this.data.settings;
  }

  // ===================
  // ORDERS & ATOMIC STATE MACHINE
  // ===================
  public getOrders(): Order[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  public getOrdersByUserId(userId: string): Order[] {
    return this.data.orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Safe status update with cancellation stock restoration logic
   */
  public updateOrderStatus(
    orderId: string,
    newStatus: Order['status'],
    note?: string
  ): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const previousStatus = order.status;

    // Handle CANCELLATION: Safely restore stock once
    if (newStatus === 'Cancelled' && !order.stockRestored) {
      for (const item of order.items) {
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (prod) {
          const variation = prod.variations.find((v) => v.id === item.variationId);
          if (variation) {
            variation.stock += item.quantity;
            prod.updatedAt = new Date().toISOString();
          }
        }
      }
      order.stockRestored = true;
    }

    // Handle REVERSING CANCELLATION back to active: re-deduct stock if needed
    if (previousStatus === 'Cancelled' && newStatus !== 'Cancelled' && order.stockRestored) {
      for (const item of order.items) {
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (prod) {
          const variation = prod.variations.find((v) => v.id === item.variationId);
          if (variation) {
            variation.stock = Math.max(0, variation.stock - item.quantity);
            prod.updatedAt = new Date().toISOString();
          }
        }
      }
      order.stockRestored = false;
    }

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      date: new Date().toISOString(),
      note: note || `Order status updated to ${newStatus}`,
    });

    this.writeToDisk(this.data);
    return order;
  }

  /**
   * Atomic Order Placement with Server-Side Stock & Price Validation
   */
  public placeOrder(orderData: {
    userId?: string | null;
    customer: Order['customer'];
    items: { productId: string; variationId: string; quantity: number }[];
    couponCode?: string | null;
    paymentMethod: 'COD' | 'CARD';
  }): { success: boolean; order?: Order; error?: string } {
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: 'Cannot place an empty order.' };
    }

    const orderItemsSnapshots: Order['items'] = [];
    let subtotal = 0;

    // 1. Validate all products and stock availability before mutating
    for (const reqItem of orderData.items) {
      if (reqItem.quantity <= 0) {
        return { success: false, error: `Invalid quantity for item.` };
      }

      const product = this.data.products.find((p) => p.id === reqItem.productId);
      if (!product || !product.active) {
        return { success: false, error: `Product not found or currently unavailable.` };
      }

      const variation = product.variations.find((v) => v.id === reqItem.variationId);
      if (!variation) {
        return {
          success: false,
          error: `Color variation not found for ${product.name}.`,
        };
      }

      if (variation.stock < reqItem.quantity) {
        return {
          success: false,
          error: `Insufficient stock for "${product.name}" in ${variation.colorName}. Only ${variation.stock} units remaining.`,
        };
      }

      // Compute authoritative price on server
      const unitPrice =
        variation.salePrice ??
        variation.price ??
        product.salePrice ??
        product.price;
      const itemSubtotal = unitPrice * reqItem.quantity;
      subtotal += itemSubtotal;

      orderItemsSnapshots.push({
        productId: product.id,
        productName: product.name,
        variationId: variation.id,
        colorName: variation.colorName,
        colorCode: variation.colorCode,
        sku: variation.sku,
        image: variation.images[0] || '',
        unitPrice,
        quantity: reqItem.quantity,
        subtotal: itemSubtotal,
      });
    }

    // 2. Coupon validation
    let discountAmount = 0;
    let appliedCoupon: Coupon | null = null;
    if (orderData.couponCode) {
      const codeClean = orderData.couponCode.trim().toUpperCase();
      const coupon = this.data.coupons.find((c) => c.code.toUpperCase() === codeClean && c.active);
      if (coupon && subtotal >= coupon.minSpend) {
        appliedCoupon = coupon;
        if (coupon.type === 'percentage') {
          discountAmount = Math.round((subtotal * coupon.value) / 100 * 100) / 100;
        } else {
          discountAmount = Math.min(coupon.value, subtotal);
        }
      }
    }

    // Dynamic settings threshold
    const settings = this.getSettings();
    const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

    // 3. Atomically decrement stock
    for (const reqItem of orderData.items) {
      const product = this.data.products.find((p) => p.id === reqItem.productId)!;
      const variation = product.variations.find((v) => v.id === reqItem.variationId)!;
      variation.stock -= reqItem.quantity;
      product.updatedAt = new Date().toISOString();
    }

    // 4. Generate unique order ID
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const orderId = `ORD-2026-${randomHex}`;

    const newOrder: Order = {
      id: orderId,
      userId: orderData.userId || null,
      customer: orderData.customer,
      items: orderItemsSnapshots,
      subtotal,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      shippingCost,
      totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: 'Pending',
      status: 'Pending',
      stockRestored: false,
      statusHistory: [
        {
          status: 'Pending',
          date: new Date().toISOString(),
          note: `Order received via ${orderData.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Card Payment'}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.orders.unshift(newOrder);
    this.writeToDisk(this.data);

    return { success: true, order: newOrder };
  }

  // ===================
  // COUPONS
  // ===================
  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public saveCoupon(coupon: Coupon): Coupon {
    const idx = this.data.coupons.findIndex(
      (c) => c.code.toUpperCase() === coupon.code.toUpperCase()
    );
    if (idx >= 0) {
      this.data.coupons[idx] = coupon;
    } else {
      this.data.coupons.push(coupon);
    }
    this.writeToDisk(this.data);
    return coupon;
  }

  public deleteCoupon(code: string): boolean {
    const initialLen = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(
      (c) => c.code.toUpperCase() !== code.toUpperCase()
    );
    if (this.data.coupons.length !== initialLen) {
      this.writeToDisk(this.data);
      return true;
    }
    return false;
  }

  public validateCoupon(
    code: string,
    subtotal: number
  ): { valid: boolean; coupon?: Coupon; discount?: number; message?: string } {
    const clean = code.trim().toUpperCase();
    const coupon = this.data.coupons.find((c) => c.code.toUpperCase() === clean && c.active);
    if (!coupon) {
      return { valid: false, message: 'Invalid or inactive promotional code.' };
    }
    if (subtotal < coupon.minSpend) {
      return {
        valid: false,
        message: `Minimum purchase of $${coupon.minSpend} required for this coupon privilege.`,
      };
    }
    const discount =
      coupon.type === 'percentage'
        ? Math.round((subtotal * coupon.value) / 100 * 100) / 100
        : Math.min(coupon.value, subtotal);
    return { valid: true, coupon, discount };
  }

  // ===================
  // REVIEWS
  // ===================
  public addProductReview(
    productId: string,
    review: { author: string; rating: number; comment: string }
  ): Product | null {
    const product = this.data.products.find((p) => p.id === productId);
    if (!product) return null;
    const newReview = {
      id: `rev_${Date.now()}`,
      author: review.author,
      rating: Math.max(1, Math.min(5, review.rating)),
      date: new Date().toISOString().split('T')[0],
      comment: review.comment,
      verifiedPurchase: true,
    };
    product.reviews.unshift(newReview);
    product.updatedAt = new Date().toISOString();
    this.writeToDisk(this.data);
    return product;
  }

  // ===================
  // CUSTOMERS
  // ===================
  public getCustomers(): CustomerSummary[] {
    const customers = this.data.users.filter((u) => u.role !== 'admin');
    return customers.map((c) => {
      const customerOrders = this.data.orders.filter(
        (o) =>
          o.userId === c.id ||
          o.customer.email.toLowerCase() === c.email.toLowerCase()
      );
      const totalSpent = customerOrders
        .filter((o) => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      const { passwordHash, ...safeUser } = c;
      return {
        ...safeUser,
        ordersCount: customerOrders.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
      };
    });
  }

  // ===================
  // ADVANCED ADMIN STATS
  // ===================
  public getAdminStats(): AdminStats {
    const totalRevenue = this.data.orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingOrders = this.data.orders.filter((o) => o.status === 'Pending').length;
    const processingOrders = this.data.orders.filter((o) => o.status === 'Processing').length;
    const shippedOrders = this.data.orders.filter((o) => o.status === 'Shipped').length;
    const deliveredOrders = this.data.orders.filter((o) => o.status === 'Delivered').length;
    const cancelledOrders = this.data.orders.filter((o) => o.status === 'Cancelled').length;

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const prod of this.data.products) {
      for (const varItem of prod.variations) {
        if (varItem.stock === 0) {
          outOfStockCount++;
        } else if (varItem.stock <= 5) {
          lowStockCount++;
        }
      }
    }

    // Calculate best selling products from non-cancelled orders
    const salesMap = new Map<string, { name: string; category: string; unitsSold: number; revenue: number }>();
    for (const order of this.data.orders) {
      if (order.status === 'Cancelled') continue;
      for (const item of order.items) {
        const existing = salesMap.get(item.productId) || {
          name: item.productName,
          category: 'Handbags',
          unitsSold: 0,
          revenue: 0,
        };
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (prod) existing.category = prod.category;
        existing.unitsSold += item.quantity;
        existing.revenue += item.subtotal;
        salesMap.set(item.productId, existing);
      }
    }

    const bestSellingProducts = Array.from(salesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders: this.data.orders.length,
      totalProducts: this.data.products.length,
      totalCategories: this.data.categories.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      lowStockItems: lowStockCount,
      outOfStockItems: outOfStockCount,
      bestSellingProducts,
    };
  }

  // ===================
  // USERS
  // ===================
  public getUsers() {
    return this.data.users;
  }

  public findAdminUser() {
    return this.data.users.find((u) => u.role === 'admin');
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }

  public findUserById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  public createUser(userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'customer';
    phone?: string;
    address?: any;
  }): User {
    const newUser: User & { passwordHash: string } = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      passwordHash: hashPassword(userData.password),
      role: userData.role || 'customer',
      phone: userData.phone || '',
      address: userData.address || {},
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.writeToDisk(this.data);
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'phone' | 'address'>>
  ): User | null {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return null;
    if (updates.name) user.name = updates.name;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.address) user.address = updates.address;
    this.writeToDisk(this.data);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // ===================
  // EMAIL NOTIFICATION LOGS
  // ===================
  public getEmailLogs(): EmailNotificationLog[] {
    return this.data.emailLogs || [];
  }

  public saveEmailLog(log: EmailNotificationLog): EmailNotificationLog {
    if (!this.data.emailLogs) {
      this.data.emailLogs = [];
    }
    this.data.emailLogs.unshift(log);
    if (this.data.emailLogs.length > 200) {
      this.data.emailLogs = this.data.emailLogs.slice(0, 200);
    }
    this.writeToDisk(this.data);
    return log;
  }
}

export const db = new Database();
