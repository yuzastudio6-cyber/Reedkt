# Internal Testing Runbook Checklist

Support owner: `FRONTEND_PRODUCT_UX`.
Supabase clean-staging target: `fnjiylwirntrqdcwpbho`.

Stop conditions:
- Any secret, DB URL, access token, signed URL, raw prompt, private payload, or media payload appears.
- Any production, external beta, paid production, provider, worker, route, tool, public artifact, or Supabase write path becomes enabled.
- Track B clean-staging sync evidence becomes stale, missing, or contradictory.
