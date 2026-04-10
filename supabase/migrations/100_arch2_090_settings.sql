---
-- Architecture 2: Settings & AI Module
-- File: 090_settings.sql
-- Purpose: System settings, integrations, AI configuration
-- Status: CLEAN SCHEMA (NO SEED DATA)
---

-- ============================================================================
-- TABLES
-- ============================================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Integrations (external service configs)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name TEXT NOT NULL UNIQUE,
  integration_type TEXT NOT NULL,  -- cloud_storage, payment, notification, etc.
  is_active BOOLEAN DEFAULT false,
  config JSONB,
  api_key_encrypted TEXT,
  last_tested_at TIMESTAMPTZ,
  last_test_status TEXT,
  configured_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- AI Interactions log
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  action_executed TEXT,
  action_status TEXT,  -- pending, success, error
  action_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);

ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- AI Actions registry (available actions for AI to execute)
CREATE TABLE IF NOT EXISTS ai_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name TEXT NOT NULL UNIQUE,
  description TEXT,
  required_role TEXT,  -- minimum role required
  endpoint TEXT NOT NULL,
  http_method TEXT DEFAULT 'POST',
  parameters_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_actions_active ON ai_actions(is_active);

ALTER TABLE ai_actions ENABLE ROW LEVEL SECURITY;

-- AI Memory/Knowledge base
CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_type TEXT NOT NULL,  -- context, knowledge, preference
  entity_type TEXT,
  entity_id UUID,
  content TEXT NOT NULL,
  embeddings TEXT,  -- vector representation
  relevance_score NUMERIC(3, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON ai_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_entity ON ai_memory(entity_type, entity_id);

ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;

-- API tokens (for integrations and external access)
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_name TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER system_settings_updated_at_trigger
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER integrations_updated_at_trigger
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER ai_memory_updated_at_trigger
  BEFORE UPDATE ON ai_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

---
-- STATUS: ✅ Ready
-- Contains: Settings, integrations, AI configuration, API tokens
-- Status: CLEAN (NO SEED DATA)
--
