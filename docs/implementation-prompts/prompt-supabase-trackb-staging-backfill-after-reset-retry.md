# Prompt: Supabase Track B Staging Backfill After Reset Retry

Current reset retry status: `blocked`.

If reset retry verification passed, rerun the guarded PR #198 Track B staging backfill path with its separate confirmations. Do not write Track B rows from the reset retry phase. Keep production, provider calls, routes, workers, media, Track A, beta, and production unlocks blocked.
