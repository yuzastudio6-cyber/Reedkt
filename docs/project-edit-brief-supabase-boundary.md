# ProjectEditBrief Supabase Boundary

RP-EDITBRIEF-03 includes a disabled `SupabaseProjectEditBriefRepository` skeleton so future persistence can implement the same interface without changing mock repository callers. The skeleton returns blocked results and performs no Supabase reads or writes.

Required future dependencies before enabling Supabase:

- Owner-approved `project_edit_briefs` schema and child table decisions.
- Auth, RLS, and explicit Data API grant review.
- Service-role boundary review for any future backend-only writes.
- Remote deployment gates and migration review.
- API/runtime route gates that preserve no-copy and no-execution policies.

Current status: Supabase disabled. This milestone runs no direct Supabase CLI, creates no migration, reads no env secrets, creates no client, and performs no remote/local database operation. It also adds no API handlers, no UI routes, no providers, no workers, no render jobs, no uploads, and no credit effects.

The disabled skeleton is intentionally boring: every result reports `supabaseReadMade: false`, `supabaseWriteMade: false`, `storageWriteMade: false`, `fileBytesRead: false`, `providerCallMade: false`, `workerJobCreated: false`, `renderJobCreated: false`, and `creditReservedOrSpent: false`.
