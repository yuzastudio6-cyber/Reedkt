# Supabase Staging Reset Retry Secret Policy

- Secret reference: `SUPABASE_DB_URL`.
- The DB URL may be loaded only into the current process environment for the retry execution.
- Reports may record presence, target-match status, payload access status, and `payloadPrinted:false`.
- Reports must not include DB URLs, hosts, usernames, passwords, service-role keys, anon keys, tokens, signed URLs, or credential payloads.
- Production, Track B writes, provider calls, workers, routes, media, Track A, beta, and production unlocks remain blocked.
