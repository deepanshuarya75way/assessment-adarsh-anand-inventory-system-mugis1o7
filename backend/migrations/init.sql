-- ============================================================
-- Inventory & Order Management System — initial schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    phone       VARCHAR(50),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)  NOT NULL,
    sku         VARCHAR(100)  NOT NULL UNIQUE,
    price       NUMERIC(10,2) NOT NULL,
    quantity    INTEGER       NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id   UUID          NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
    status        VARCHAR(20)   NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- ------------------------------------------------------------
-- order_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID          NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id  UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER       NOT NULL,
    unit_price  NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- Seed data
-- ============================================================

-- Sample products (5)
INSERT INTO products (id, name, sku, price, quantity) VALUES
    ('a1b2c3d4-0001-4000-8000-000000000001', 'Wireless Bluetooth Headphones', 'ELEC-WBH-001', 79.99,  150),
    ('a1b2c3d4-0002-4000-8000-000000000002', 'Mechanical Keyboard – TKL',     'ELEC-MKB-002', 129.00,  80),
    ('a1b2c3d4-0003-4000-8000-000000000003', 'USB-C Charging Hub (7-Port)',    'ELEC-UCH-003',  49.95, 200),
    ('a1b2c3d4-0004-4000-8000-000000000004', 'Ergonomic Office Chair',         'FURN-EOC-004', 349.00,  30),
    ('a1b2c3d4-0005-4000-8000-000000000005', 'Standing Desk Converter',        'FURN-SDC-005', 199.50,  55)
ON CONFLICT (id) DO NOTHING;

-- Sample customers (3)
INSERT INTO customers (id, full_name, email, phone) VALUES
    ('b2c3d4e5-0001-4000-8000-000000000001', 'Priya Sharma',    'priya.sharma@example.com',    '+1-415-555-0101'),
    ('b2c3d4e5-0002-4000-8000-000000000002', 'James O''Brien',  'james.obrien@example.com',    '+1-212-555-0187'),
    ('b2c3d4e5-0003-4000-8000-000000000003', 'Aisha Nkemdirim', 'aisha.nkemdirim@example.com', '+44-20-5550-0243')
ON CONFLICT (id) DO NOTHING;
