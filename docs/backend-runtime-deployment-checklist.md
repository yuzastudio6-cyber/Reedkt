# Backend Runtime Deployment Checklist

- [ ] Supabase migrations deployed.
- [ ] Generated database types created.
- [ ] Service role stored in Secret Manager.
- [ ] Provider keys stored in Secret Manager.
- [ ] Stripe keys stored in Secret Manager.
- [ ] Cloud Run service account created.
- [ ] Cloud Run service account permissions reviewed.
- [ ] Health route works.
- [ ] Readiness route works.
- [ ] Route registry works.
- [ ] No secrets in frontend.
- [ ] No secrets in repo.
- [ ] Mock routes pass.
- [ ] Real provider routes disabled until approved.
- [ ] Real render routes disabled until approved.
- [ ] Real credit mutations are transactional and backend-only.
- [ ] Worker lease claims are transactional and backend-only.
- [ ] Monitoring and rate limits reviewed.
