-- Consolidated SQL Script for Database Initialization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Roles and RBAC
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

INSERT INTO roles (name, description)
VALUES
('Admin', 'Full Access'),
('Engineer', 'View/Add Expense/Worker, Exports'),
('Supervisor', 'View/Add Expense/Worker, NO Exports'),
('Mason', 'Own Log & Photo Upload ONLY'),
('Worker', 'Own Log & Photo Upload ONLY')
ON CONFLICT (name) DO NOTHING;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE,
    role_id INT REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- Ensure the `name` column in `expense_categories` has a unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'expense_categories' AND constraint_type = 'UNIQUE'
    ) THEN
        ALTER TABLE expense_categories ADD CONSTRAINT expense_categories_name_unique UNIQUE (name);
    END IF;
END $$;

-- Ensure the `description` column exists in `expense_categories`
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expense_categories' AND column_name = 'description'
    ) THEN
        ALTER TABLE expense_categories ADD COLUMN description TEXT;
    END IF;
END $$;

-- Insert data into `expense_categories`
INSERT INTO expense_categories (name, description)
VALUES
('Land & Legal', 'Expenses related to land and legal matters'),
('Professional Services', 'Expenses for professional services'),
('Labour & Wages', 'Labour and wage-related expenses'),
('Construction Materials', 'Expenses for construction materials'),
('Equipment & Tools', 'Expenses for equipment and tools'),
('Transport & Logistics', 'Transport and logistics expenses'),
('Site Management', 'Site management expenses'),
('Showroom Interior', 'Expenses for showroom interior design'),
('Product Procurement', 'Expenses for product procurement'),
('Business Running Cost', 'General business running costs'),
('Financial', 'Financial expenses'),
('Emergency & Misc', 'Emergency and miscellaneous expenses')
ON CONFLICT (name) DO NOTHING;

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- POS Transactions Table
CREATE TABLE IF NOT EXISTS pos_transactions (
    id SERIAL PRIMARY KEY,
    transaction_id UUID DEFAULT gen_random_uuid(),
    product_id INT REFERENCES inventory(id),
    quantity INT NOT NULL,
    unit_price_at_sale NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_price_at_sale) STORED,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Worker Logs Table
CREATE TABLE IF NOT EXISTS worker_logs (
    id SERIAL PRIMARY KEY,
    worker_name VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    wage NUMERIC(10, 2),
    attendance INT DEFAULT 0,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    unpaid_balance NUMERIC(10, 2) GENERATED ALWAYS AS (wage * attendance - paid_amount) STORED,
    supervisor_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Progress Cam Table
CREATE TABLE IF NOT EXISTS progress_cam (
    id SERIAL PRIMARY KEY,
    photo_url TEXT NOT NULL,
    phase_tag VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    uploaded_by UUID REFERENCES users(id)
);

-- Audit Logs Table
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

-- Row-Level Security Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'user_isolation' AND tablename = 'users'
    ) THEN
        CREATE POLICY user_isolation ON users
        USING (id = current_setting('app.current_user_id', true)::UUID);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'worker_log_isolation' AND tablename = 'worker_logs'
    ) THEN
        CREATE POLICY worker_log_isolation ON worker_logs
        USING (supervisor_id = current_setting('app.current_user_id', true)::UUID);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'progress_cam_isolation' AND tablename = 'progress_cam'
    ) THEN
        CREATE POLICY progress_cam_isolation ON progress_cam
        USING (uploaded_by = current_setting('app.current_user_id', true)::UUID);
    END IF;
END $$;