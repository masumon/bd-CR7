-- Migration 028: Add unique constraint on users.user_code
-- Prevents duplicate user_code values that the application already enforces at
-- the API layer (routers/users.py PATCH /me/profile) but was missing at the DB level.

ALTER TABLE users
  ADD CONSTRAINT users_user_code_unique UNIQUE (user_code);
