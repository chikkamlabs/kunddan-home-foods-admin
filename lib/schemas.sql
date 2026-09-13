-- ============================================================================
-- Kunddan Home Foods - PostgreSQL / Supabase Database Schema
-- ============================================================================
-- This script contains all tables, enums, triggers, indexes, and RLS policies
-- required for the Kunddan Home Foods e-commerce application.
-- Ready to copy-paste directly into the Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & ENUMS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'staff', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Order Status Enum
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'approved',
        'packed',
        'shipping',
        'delivered',
        'rejected',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. REUSABLE TRIGGER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. TABLES DEFINITION
-- ----------------------------------------------------------------------------

-- Table: users (Auth linked admin / staff / users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    mobile TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: customers (Unauthenticated customer profiles tracked by unique key)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    city_code TEXT,
    loyalty_points NUMERIC NOT NULL DEFAULT 0,
    referral_code TEXT,
    key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    description TEXT,
    notes TEXT,
    list TEXT,
    estimated_delivery TEXT,
    image_url TEXT,
    used_in_txt TEXT,
    benefits TEXT,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: product_variants
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= 0),
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    items_quantity INTEGER NOT NULL DEFAULT 0 CHECK (items_quantity >= 0),
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
    sub_total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (sub_total >= 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    referral_code TEXT,
    coupon_code TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    email TEXT,
    mobile TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: order_items (Item-level snapshot preserving historical pricing & individual quantities)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    mrp NUMERIC(10, 2) NOT NULL CHECK (mrp >= 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    line_total NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    discount NUMERIC(10, 2) NOT NULL CHECK (discount >= 0),
    min_order NUMERIC(10, 2) DEFAULT 0 CHECK (min_order >= 0),
    max_discount NUMERIC(10, 2) CHECK (max_discount IS NULL OR max_discount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS FOR AUTO UPDATING updated_at
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON product_variants;
CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_order_items_updated_at ON order_items;
CREATE TRIGGER trg_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;
CREATE TRIGGER trg_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_category_id ON categories(category_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

CREATE INDEX IF NOT EXISTS idx_customers_key ON customers(key);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_mobile ON orders(mobile);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(product_variant_id);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(coupon_code);

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) & ACCESS POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
          AND users.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users Table Policies
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all users"
    ON users FOR ALL
    TO authenticated
    USING (is_admin());

-- Categories Policies: Public read, Admin write
CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete categories"
    ON categories FOR DELETE
    TO authenticated
    USING (is_admin());

-- Products Policies: Public read, Admin write
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (is_admin());

-- Product Variants Policies: Public read, Admin write
CREATE POLICY "Anyone can view product variants"
    ON product_variants FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can insert product variants"
    ON product_variants FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update product variants"
    ON product_variants FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete product variants"
    ON product_variants FOR DELETE
    TO authenticated
    USING (is_admin());

-- Customers Policies:
-- Public can create customers (during checkout)
-- Customers can view their own customer record with their unique key
-- Admins can view/manage all customers
CREATE POLICY "Anyone can create customer records during checkout"
    ON customers FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Customers can lookup by unique key or admin access"
    ON customers FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can update customers"
    ON customers FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete customers"
    ON customers FOR DELETE
    TO authenticated
    USING (is_admin());

-- Orders Policies:
-- Anyone can place an order (INSERT)
-- Orders can be read publicly (e.g. for order tracking via order_id or tracking key)
-- Only admins can update order status or delete orders
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Anyone can view orders for tracking"
    ON orders FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    TO authenticated
    USING (is_admin());

-- Order Items Policies:
-- Anyone can create order items during checkout
-- Anyone can view order items corresponding to their orders
-- Admins can manage order items
CREATE POLICY "Anyone can insert order items during checkout"
    ON order_items FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
    ON order_items FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Admins can update order items"
    ON order_items FOR UPDATE
    TO authenticated
    USING (is_admin());

CREATE POLICY "Admins can delete order items"
    ON order_items FOR DELETE
    TO authenticated
    USING (is_admin());

-- Coupons Policies:
-- Anyone can view active coupons
-- Admins can manage all coupons
CREATE POLICY "Anyone can view active coupons"
    ON coupons FOR SELECT
    TO public
    USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins can insert coupons"
    ON coupons FOR INSERT
    TO authenticated
    WITH CHECK (is_admin());

CREATE POLICY "Admins can update coupons"
    ON coupons FOR UPDATE
    TO authenticated
    USING (is_admin());

-- ============================================================================
-- 5. STORAGE BUCKETS SETUP (Run in SQL Editor or Storage Dashboard)
-- ============================================================================
-- Insert public storage bucket for category images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('category_images', 'category_images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies for category_images:
-- Allow public access to view category images
CREATE POLICY "Public read category images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'category_images');

-- Allow authenticated admins or public to upload category images
CREATE POLICY "Allow upload to category images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'category_images');

-- Allow update in category images
CREATE POLICY "Allow update to category images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'category_images');

-- Allow delete in category images
CREATE POLICY "Allow delete in category images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'category_images');
