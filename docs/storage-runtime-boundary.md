# Storage Runtime Boundary

## Frontend Boundary

Browser code may use only the frontend-safe Supabase anon client. RP-FIX-07 storage helpers use `src/backend/supabase/supabase-client.ts` and never create an admin client.

The frontend can upload directly only when Supabase Storage RLS and bucket policies allow the signed-in user to write that exact object path.

## Backend-Only Boundary

Service-role and admin storage logic must stay in a backend runtime. Future options include:

- Cloud Run API;
- Supabase Edge Functions;
- serverless API routes;
- worker-controlled signed upload and signed download endpoints.

## Signed URLs

Private media should be delivered with short-lived signed URLs or a backend delivery route. Public URLs are blocked by default in the helper unless a caller explicitly allows them.

## Generated And Rendered Assets

Generated assets, preview renders, final exports, QA artifacts, and worker temp files should be written by backend workers later. Workers must execute approved snapshots, respect credit reservations, and avoid exposing credentials to browser code.

## Current Status

RP-FIX-07 is partially fixed:

- validation, path planning, bucket mapping, mock records, and mock flows exist;
- a local policy-readiness migration exists;
- real runtime still requires deployed buckets, tested RLS, configured public env values, and likely backend signed upload/download support.
