-- ReeditPro manual SQL test file.
-- Do not run in production.
-- Use only in local/staging Supabase testing.
-- Created by RP-DATA-04.

-- Approved snapshot immutability checklist.
-- 1. Insert an approved_plan_snapshots row with immutable = true through a backend/service-role test path.
-- 2. Confirm snapshot_json stores the full approved execution contract.
-- 3. Attempt to update snapshot_json; the trigger should raise an exception.
-- 4. Attempt to delete the approved snapshot; the trigger should raise an exception.
-- 5. Confirm approval_records.approved_snapshot_id points to the exact snapshot.
-- 6. Confirm generation_requests and editing_jobs reference approved_plan_snapshot_id before worker execution.

-- Do not run these checks in production.
