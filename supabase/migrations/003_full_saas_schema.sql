-- 003_full_saas_schema.sql
-- Full additive SaaS schema for BD CR7 domains.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

INSERT INTO roles (name, description)
VALUES
  ('admin', 'Platform administrator'),
  ('maker', 'Creates transactions and records'),
  ('checker', 'Approves/rejects maker actions'),
  ('viewer', 'Read-only access')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  role_id INT NOT NULL REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(140) NOT NULL,
  location VARCHAR(200),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fund_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name VARCHAR(120) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  owner_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID NOT NULL REFERENCES fund_accounts(id),
  to_account_id UUID NOT NULL REFERENCES fund_accounts(id),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  reference VARCHAR(120) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES fund_accounts(id),
  category_id UUID REFERENCES expense_categories(id),
  amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  maker_id UUID NOT NULL REFERENCES users(id),
  checker_id UUID REFERENCES users(id),
  approval_note TEXT,
  approved_at TIMESTAMP,
  risk_level VARCHAR(20) DEFAULT 'low',
  risk_score INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  maker_id UUID NOT NULL REFERENCES users(id),
  checker_id UUID REFERENCES users(id),
  checker_note TEXT,
  decided_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(200),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  barcode VARCHAR(80) NOT NULL UNIQUE,
  purchase_price NUMERIC(18,2) NOT NULL DEFAULT 0,
  sell_price NUMERIC(18,2) NOT NULL,
  stock_qty NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  cashier_id UUID NOT NULL REFERENCES users(id),
  total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(18,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(18,2) NOT NULL,
  line_total NUMERIC(18,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  trade VARCHAR(80) NOT NULL,
  daily_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  attendance_date DATE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  marked_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(worker_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS material_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  material_name VARCHAR(120) NOT NULL,
  quantity NUMERIC(18,2) NOT NULL,
  unit_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lc_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR(120) NOT NULL,
  lc_number VARCHAR(100) NOT NULL UNIQUE,
  currency VARCHAR(3) NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  expected_arrival DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lc_record_id UUID NOT NULL REFERENCES lc_records(id) ON DELETE CASCADE,
  goods_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  freight_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  insurance_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  duty_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  handling_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_account_status ON expenses(account_id, status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_attendance_worker_day ON attendance(worker_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_lc_records_status ON lc_records(status);
CREATE INDEX IF NOT EXISTS idx_ai_memory_embedding ON ai_memory USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE landed_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='users' AND policyname='users_self_or_admin') THEN
    CREATE POLICY users_self_or_admin ON users FOR SELECT TO authenticated
    USING (id = auth.uid() OR EXISTS (
      SELECT 1 FROM roles r JOIN users u ON u.role_id=r.id WHERE u.id = auth.uid() AND r.name='admin'
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='expenses' AND policyname='expenses_maker_checker') THEN
    CREATE POLICY expenses_maker_checker ON expenses FOR ALL TO authenticated
    USING (
      maker_id = auth.uid() OR checker_id = auth.uid() OR EXISTS (
        SELECT 1 FROM roles r JOIN users u ON u.role_id=r.id WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
      )
    )
    WITH CHECK (
      maker_id = auth.uid() OR EXISTS (
        SELECT 1 FROM roles r JOIN users u ON u.role_id=r.id WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fund_accounts' AND policyname='fund_accounts_owner') THEN
    CREATE POLICY fund_accounts_owner ON fund_accounts FOR SELECT TO authenticated
    USING (owner_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM roles r JOIN users u ON u.role_id=r.id WHERE u.id = auth.uid() AND r.name IN ('admin','checker')
    ));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ai_memory' AND policyname='ai_memory_authenticated') THEN
    CREATE POLICY ai_memory_authenticated ON ai_memory FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
