# RP-DATA-03-SUPABASE-MIGRATION-DRAFT-STATIC-IMPLEMENTATION

Use this prompt only after `RP-DATA-02-SUPABASE-MIGRATION-SAFETY-PACKET` is merged.

Create a static migration draft for the internal beta data foundation. The draft may add repository migration SQL files and static diagnostics only. It must not run SQL, apply migrations, create buckets, deploy RLS, touch a Supabase environment, use service-role credentials, execute workers, call providers/models, create signed/public artifacts, or unlock internal beta.

The draft must map every RP-DATA-01 internal beta minimum table and every RP-DATA-02 safety gate to explicit SQL, RLS, storage, advisor, and rollback evidence. A later guarded execution prompt must name the target environment before any migration can run.
