-- 000_FINAL_MASTER_SCHEMA.sql: Consolidated Schema for BD-CR7 Ultra Enterprise

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- MODULE 1: AUTH & SECURITY
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    biometric_public_key TEXT,
    phone_number VARCHAR(15) UNIQUE,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MODULE 2: FINANCE (FUNDS)
CREATE TABLE IF NOT EXISTS funds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    currency VARCHAR(3) CHECK (currency IN ('BDT', 'USD', 'SAR')),
    sender_id UUID,
    receiver_id UUID,
    payment_method VARCHAR(20) CHECK (payment_method IN ('bKash', 'Bank', 'Western Union')),
    is_received BOOLEAN DEFAULT FALSE
);

-- MODULE 3: FINANCE (EXPENSES)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount NUMERIC NOT NULL,
    category_id INT,
    description TEXT,
    receipt_url TEXT,
    paid_by UUID,
    approved_by UUID,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Insert Master Categories
DO $$
BEGIN
    FOR i IN 1..12 LOOP
        INSERT INTO expenses (category_id, description)
        VALUES (i, 'CAT-' || LPAD(i::TEXT, 2, '0'))
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- MODULE 4: WORKER & HR
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT,
    daily_wage NUMERIC,
    unpaid_balance NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES workers(id),
    date DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('Present', 'Absent', 'Half')),
    supervised_by UUID,
    location_lat_long POINT
);

-- MODULE 5: CONSTRUCTION MATERIALS & PROGRESS
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    quantity NUMERIC,
    unit_price NUMERIC,
    supplier TEXT
);

CREATE TABLE IF NOT EXISTS progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_tag TEXT CHECK (phase_tag IN ('Foundation', 'Frame', 'Roofing', 'Interior')),
    media_url TEXT,
    notes TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- MODULE 6: RETAIL POS & INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    stock_quantity NUMERIC,
    purchase_price NUMERIC,
    selling_price NUMERIC
);

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID REFERENCES inventory(id),
    quantity NUMERIC NOT NULL,
    unit_price_at_sale NUMERIC NOT NULL,
    total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price_at_sale) STORED,
    sold_by UUID
);

-- MODULE 7: AI & SYSTEM LOGS
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    actor_name TEXT,
    old_values JSONB,
    new_values JSONB,
    row_hash TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MODULE 8: SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    language VARCHAR(2) CHECK (language IN ('BN', 'EN'))
);

-- MODULE 9: ROW-LEVEL SECURITY
-- Enable RLS for all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;