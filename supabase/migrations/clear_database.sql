-- Clear Entire Database SQL Script

-- Drop all tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(rec.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all sequences
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(rec.sequencename) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all views
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(rec.viewname) || ' CASCADE';
    END LOOP;
END $$;

-- Drop all extensions (excluding core extensions like plpgsql)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT extname FROM pg_extension WHERE extname NOT IN ('plpgsql'))
    LOOP
        EXECUTE 'DROP EXTENSION IF EXISTS ' || quote_ident(rec.extname) || ' CASCADE';
    END LOOP;
END $$;