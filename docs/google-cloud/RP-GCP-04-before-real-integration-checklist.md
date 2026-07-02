# RP-GCP-04 Before Real Integration Checklist

Use this checklist before any later milestone creates real Google Cloud resources, deploys services, calls providers, renders media, connects remote Supabase, or adds billing.

- [ ] Baseline build passed.
- [ ] Baseline lint passed.
- [ ] No secrets added.
- [ ] No Google SDK/provider SDK network calls added.
- [ ] Approved snapshot contract exists.
- [ ] Worker payload contracts exist.
- [ ] Storage path contracts exist.
- [ ] Provider gateway policy exists.
- [ ] Remotion render worker contract exists.
- [ ] Runtime readiness checks exist.
- [ ] `.env.example` placeholders only.
- [ ] Supabase service role remains backend-only.
- [ ] Frontend does not import server-only secrets.
- [ ] No real Google Cloud resources created.
- [ ] No provider API calls added.
- [ ] No rendering execution added.
- [ ] No browser capture execution added.
- [ ] No Stripe integration added.

RP-GCP-00 should leave this checklist mostly unchecked; it creates the readiness surface, not the production integration.

