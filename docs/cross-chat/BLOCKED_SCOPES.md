# Blocked Scopes

The merge-hygiene audit keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, or repair
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- broad Track A runtime execution
- beta or production unlocks

Blocked means no owner should treat this audit as an execution approval.
