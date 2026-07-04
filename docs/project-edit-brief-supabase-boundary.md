# ProjectEditBrief Supabase Boundary

RP-EDITBRIEF-03 includes a disabled `SupabaseProjectEditBriefRepository` skeleton so future persistence can implement the same interface without changing mock repository callers. The skeleton returns blocked results and performs no Supabase reads or writes.

Required future dependencies before enabling Supabase:

- Owner-approved durable roots: `edit_briefs`, `edit_cues`, `edit_cue_assets`, `edit_cue_messages`, `edit_cue_intents`, `edit_cue_confirmations`, `edit_cue_conflicts`, `edit_cue_revisions`, `edit_brief_application_logs`, and `edit_session_export_settings`.
- Auth, RLS, and explicit Data API grant review.
- Service-role boundary review for any future backend-only writes.
- Remote deployment gates and migration review.
- API/runtime route gates that preserve no-copy and no-execution policies.

RP-EDITBRIEF-13 records that earlier `project_edit_*` names are logical/historical names only. The default persistence path maps ProjectEditBrief concepts onto the existing Edit Brief/Edit Cue roots unless an owner explicitly approves a table-family rename.

Current status: Supabase disabled. This milestone runs no direct Supabase CLI, creates no migration, reads no env secrets, creates no client, and performs no remote/local database operation. It also adds no API handlers, no UI routes, no providers, no workers, no render jobs, no uploads, and no credit effects.

The disabled skeleton is intentionally boring: every result reports `supabaseReadMade: false`, `supabaseWriteMade: false`, `storageWriteMade: false`, `fileBytesRead: false`, `providerCallMade: false`, `workerJobCreated: false`, `renderJobCreated: false`, and `creditReservedOrSpent: false`.
