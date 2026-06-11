# Supabase Track B Clean Staging Backfill Secret Policy

This phase must not print, report, or commit secrets.

Forbidden payloads include:

- DB URLs;
- service-role keys;
- anon keys;
- access tokens;
- passwords;
- JWT secrets;
- signed URLs;
- provider keys;
- private artifact contents;
- raw media/audio/frame/transcript/model payloads;
- raw prompts or user PII.

Reports may record booleans such as `secretsPrintedOrCommitted:false`, `dbUrlIncluded:false`, and `productionAffected:false`.

The preferred write path is the Supabase plugin scoped by project ref `fnjiylwirntrqdcwpbho`, which avoids exposing database credential payloads to the repository.
