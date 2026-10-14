-- ========================================================
-- LuxeCarry PostgreSQL Schema for Supabase
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CATEGORIES TABLE
create table if not exists public.categories (
    id text primary key,
    name text not null,
    slug text not null unique,
    description text,
    image text,
    active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PRODUCTS TABLE
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

-- 3. PRODUCT VARIATIONS TABLE (Color Variations & Stock)
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

-- 4. REVIEWS TABLE
create table if not exists public.reviews (
    id text primary key,
    product_id text references public.products(id) on delete cascade not null,
    author text not null,
    rating integer check (rating >= 1 and rating <= 5) not null,
    date text not null,
    comment text not null,
    verified_purchase boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDERS TABLE
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

-- 6. ORDER ITEMS TABLE
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

-- 7. COUPONS TABLE
create table if not exists public.coupons (
    code text primary key,
    type text not null check (type in ('percentage', 'fixed')),
    value numeric(10, 2) not null,
    min_order_amount numeric(10, 2) default 0 not null,
    active boolean default true not null,
    description text
);

-- 8. STORE SETTINGS TABLE
create table if not exists public.store_settings (
    id integer primary key default 1,
    shipping_fee numeric(10, 2) default 25 not null,
    free_shipping_threshold numeric(10, 2) default 300 not null,
    store_email text default 'concierge@luxecarry.com',
    store_phone text default '+1 (555) 019-2834',
    store_address text default 'Via de'' Tornabuoni, 14, 50123 Firenze FI, Italy',
    cod_enabled boolean default true not null
);

-- Enable Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variations enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.coupons enable row level security;
alter table public.store_settings enable row level security;

-- Public Read Policies
create policy "Allow public read access on categories" on public.categories for select using (true);
create policy "Allow public read access on active products" on public.products for select using (true);
create policy "Allow public read access on product variations" on public.product_variations for select using (true);
create policy "Allow public read access on reviews" on public.reviews for select using (true);
create policy "Allow public read access on store settings" on public.store_settings for select using (true);
create policy "Allow public read access on coupons" on public.coupons for select using (true);

-- Allow inserting orders & reviews publicly
create policy "Allow public insert on orders" on public.orders for insert with check (true);
create policy "Allow public insert on order_items" on public.order_items for insert with check (true);
create policy "Allow public insert on reviews" on public.reviews for insert with check (true);

-- Initial Coupons
insert into public.coupons (code, type, value, min_order_amount, active, description)
values 
    ('LUXE10', 'percentage', 10, 0, true, '10% off your entire atelier order'),
    ('VIP20', 'percentage', 20, 300, true, '20% exclusive VIP discount on orders over $300'),
    ('SUMMER50', 'fixed', 50, 400, true, '$50 off luxury seasonal collection over $400')
on conflict (code) do nothing;

-- Initial Settings
insert into public.store_settings (id, shipping_fee, free_shipping_threshold, store_email, store_phone, store_address, cod_enabled)
values (1, 25, 300, 'concierge@luxecarry.com', '+1 (555) 019-2834', 'Via de'' Tornabuoni, 14, 50123 Firenze FI, Italy', true)
on conflict (id) do nothing;
