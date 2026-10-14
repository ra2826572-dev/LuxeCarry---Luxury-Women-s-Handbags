import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { db } from './db.ts';

dotenv.config();

const CONFIG_FILE = path.resolve(process.cwd(), 'data', 'supabase_config.json');

interface SupabaseConfig {
  url: string;
  key: string;
}

function loadSavedConfig(): SupabaseConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read Supabase config file:', err);
  }
  return { url: '', key: '' };
}

export function saveSupabaseConfig(url: string, key: string) {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ url, key }, null, 2), 'utf-8');
    // Also reset current instance
    supabaseInstance = null;
  } catch (err) {
    console.error('Failed to save Supabase config file:', err);
  }
}

export function getSupabaseCredentials(): SupabaseConfig {
  const saved = loadSavedConfig();
  const url = saved.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key =
    saved.key ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';
  return { url, key };
}

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
    url.startsWith('https://') &&
    key &&
    key.length > 20
  );
}

export function getSupabaseClient(forceRefresh: boolean = false): SupabaseClient | null {
  if (forceRefresh) {
    supabaseInstance = null;
  }

  const { url, key } = getSupabaseCredentials();
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<{
  connected: boolean;
  message: string;
  url?: string;
  tableCount?: number;
}> {
  const creds = getSupabaseCredentials();
  const url = overrideUrl || creds.url;
  const key = overrideKey || creds.key;

  if (!url || !key) {
    return {
      connected: false,
      message: 'Supabase credentials are not set. Please provide your Project URL and API Key.',
      url: url || undefined,
    };
  }

  if (key.length < 15) {
    return {
      connected: false,
      message: 'API Key is too short. Please provide a valid Supabase anon or service_role key.',
      url,
    };
  }

  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Try selecting from categories
    const { data, error } = await client.from('categories').select('id').limit(1);

    if (error) {
      if (
        error.code === '42P01' ||
        error.code === 'PGRST205' ||
        error.message?.includes('schema cache') ||
        error.message?.includes('does not exist')
      ) {
        return {
          connected: true,
          message: 'Connected to Supabase project! Note: Tables are not created yet. Please execute the SQL schema in your Supabase SQL Editor.',
          url,
        };
      }
      return {
        connected: false,
        message: `Supabase returned error: ${error.message}`,
        url,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected and verified Supabase database!',
      url,
      tableCount: data ? data.length : 0,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Failed to reach Supabase endpoint',
      url,
    };
  }
}

/**
 * Sync all products, categories, coupons, and settings from local persistent DB into Supabase
 */
export async function syncLocalStoreToSupabase(): Promise<{
  success: boolean;
  syncedProducts: number;
  syncedCategories: number;
  errors: string[];
}> {
  const client = getSupabaseClient(true);
  if (!client) {
    throw new Error('Supabase is not configured or client failed to initialize.');
  }

  const errors: string[] = [];
  let syncedProducts = 0;
  let syncedCategories = 0;

  const categories = db.getCategories();
  const products = db.getProducts();

  // 1. Sync Categories
  for (const cat of categories) {
    const { error } = await client.from('categories').upsert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      active: cat.active,
    });
    if (error) {
      errors.push(`Category ${cat.name}: ${error.message}`);
    } else {
      syncedCategories++;
    }
  }

  // 2. Sync Products and Variations
  for (const prod of products) {
    const { error: prodErr } = await client.from('products').upsert({
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      category: prod.category,
      price: prod.price,
      sale_price: prod.salePrice,
      description: prod.description,
      materials: prod.materials,
      dimensions: prod.dimensions,
      care_instructions: prod.careInstructions,
      featured: prod.featured,
      is_new: prod.isNew,
      is_best_seller: prod.isBestSeller,
      active: prod.active,
      created_at: prod.createdAt,
      updated_at: prod.updatedAt,
    });

    if (prodErr) {
      errors.push(`Product ${prod.name}: ${prodErr.message}`);
      continue;
    }

    syncedProducts++;

    // Variations
    for (const v of prod.variations) {
      const { error: varErr } = await client.from('product_variations').upsert({
        id: v.id,
        product_id: prod.id,
        color_name: v.colorName,
        color_code: v.colorCode,
        sku: v.sku,
        price: v.price,
        sale_price: v.salePrice,
        stock: v.stock,
        images: v.images,
      });
      if (varErr) {
        errors.push(`Variation ${v.sku}: ${varErr.message}`);
      }
    }
  }

  return {
    success: errors.length === 0,
    syncedProducts,
    syncedCategories,
    errors,
  };
}
