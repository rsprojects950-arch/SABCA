-- Migration 019: Diagnostic RPC for table discovery
-- This allows the delete-user Edge Function to list tables for debugging

CREATE OR REPLACE FUNCTION get_tables_diagnostic()
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(table_name)
        FROM information_schema.tables
        WHERE table_schema = 'public'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
