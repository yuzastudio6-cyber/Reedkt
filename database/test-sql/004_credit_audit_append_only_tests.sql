-- ReeditPro manual SQL test file.
-- Do not run in production.
-- Use only in local/staging Supabase testing.
-- Created by RP-DATA-04.

-- Credit and audit append-only checklist.
-- 1. Insert a credit_ledger_entries row through a backend/service-role test path.
-- 2. Attempt to update the credit ledger row; the trigger should raise an exception.
-- 3. Attempt to delete the credit ledger row; the trigger should raise an exception.
-- 4. Insert an audit_events row through a backend/service-role test path.
-- 5. Attempt to update the audit event; the trigger should raise an exception.
-- 6. Attempt to delete the audit event; the trigger should raise an exception.
-- 7. Confirm normal users can read only project/workspace-scoped audit events when policy allows.

-- Do not run these checks in production.
