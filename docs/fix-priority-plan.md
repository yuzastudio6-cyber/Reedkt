# Fix Priority Plan

## Phase 1 - Fix broken/missing files

- `RP-FIX-01 - Export Latest Timing Orchestrators And Scenarios` - completed by RP-FIX-01
- `RP-DOCS-FIX-01 — Create Current Implementation Status Index`
- `RP-AUDIO-FIX-01 — Add Or Reconcile SoundSync Music Architecture Doc`

## Phase 2 - Fix type/export/build issues

- `RP-FIX-03 - Add Backend Barrel Import Smoke Tests For Implemented Mock Modules`
- `RP-FIX-04 — Add Smoke Tests For Mock Orchestrator Imports`

## Phase 3 - Fix migration docs/order

- `RP-FIX-02 - Align Migration Order With Actual Migrations + Schema Readiness Docs` - completed by RP-FIX-02
- `RP-FIX-04 - Reconcile Overlapping 20260513 And 20260518 Migration Chains`
- `RP-SUPABASE-FIX-05 — Decide Dedicated SoundSync Music Migration Status`
- `RP-SUPABASE-FIX-06 — Expand Table Name Mapping For Newer Migrations`

## Phase 4 - Verify/deploy Supabase

- `RP-FIX-03 - Supabase CLI + Link + Generated Types Readiness` - completed by RP-FIX-03
- `RP-FIX-04 - Safe Supabase Deploy Gate Run` - partially fixed by RP-FIX-04; deployment blocked safely
- `RP-SUPABASE-FIX-00 - Validate Or Reconcile Overlapping 20260513 And 20260518 Migration Chains`
- `RP-SUPABASE-FIX-01 - Install CLI, Confirm ReeditPro Project, Dry-Run, Deploy, Verify`
- `RP-SUPABASE-FIX-07 — Remote Table Verification And Migration History Report`
- `RP-SUPABASE-FIX-02 — Generate Remote Database Types`

## Phase 5 - Connect Supabase client safely

- `RP-FIX-05 - Supabase Client Safe Connection + Backend Runtime Boundary` - completed by RP-FIX-05
- `RP-SUPABASE-FIX-03 — Wire Supabase Client Into Auth And Persistence After Deployment`
- `RP-SUPABASE-FIX-08 — Preserve Backend-Only Service Role Boundary`
- `RP-SUPABASE-FIX-09 — Add Runtime Env Validation Without Printing Secrets`

## Phase 6 - Backend API runtime boundary

- `RP-BACKEND-FIX-01 — Backend API Runtime Boundary` - still required; RP-FIX-05 documented the boundary only
- `RP-BACKEND-FIX-02 — Persistence Adapters For Mock Services`
- `RP-BACKEND-FIX-03 — Request/Auth Context For Workspace-Scoped Reads`

## Phase 7 - Auth/storage/upload readiness

- `RP-AUTH-FIX-01 — Auth And Profile Bootstrap`
- `RP-STORAGE-FIX-01 — Storage Bucket Verification And Upload Metadata`
- `RP-MEDIA-FIX-01 — Source Sequence Persistence From Uploaded Media`

## Phase 8 - Worker/provider readiness

- `RP-WORKER-FIX-01 — Worker Queue And Runtime Boundary`
- `RP-PROVIDER-FIX-01 — Provider Secret Manager Boundary`
- `RP-CREDIT-FIX-01 — Credit Reservation/Spend Backend Enforcement`

## Phase 9 - Real AI/render integration later

- `RP-LYRIA-REAL-01 — Real Lyria Integration Behind Worker Gate`
- `RP-SFX-REAL-01 — Real Mirelo/MMAudio Integration Behind Worker Gate`
- `RP-RENDER-REAL-01 — Real Render Worker Prototype`
- `RP-QA-REAL-01 — Real Media QA Pipeline`
