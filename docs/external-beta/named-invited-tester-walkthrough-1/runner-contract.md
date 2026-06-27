# Runner Contract

Command:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_NAMED_INVITED_TESTER_WALKTHROUGH=true REEDITPRO_EXTERNAL_BETA_NAMED_INVITED_TESTER_EMAIL=aiediting@reeditpro.com npm run rp-external-beta-named-invited-tester-walkthrough-1
```

The runner fails closed unless `REEDITPRO_CONFIRM_EXTERNAL_BETA_NAMED_INVITED_TESTER_WALKTHROUGH=true` is set.

Allowed checks:

- read Google Group membership for `external-beta-testers@reeditpro.com`;
- read Cloud Run IAM for `reeditpro-staging-api`;
- read Cloud Run service status for `reeditpro-staging-api`;
- create an ephemeral identity token without printing or persisting it;
- perform unauthenticated/authenticated safe `GET` checks for `/`, `/dashboard`, `/projects`, `/editor`, `/api/routes`, and `/api/runtime/status`;
- fetch the authenticated browser shell JS/CSS assets.

Forbidden actions:

- Google Group membership mutation;
- Cloud Run IAM mutation;
- Cloud Run deployment or service update;
- Supabase mutation or SQL execution;
- Secret Manager payload access;
- provider/model calls;
- worker execution or dispatch;
- browser capture;
- signed/public artifact creation;
- credit mutation or Stripe/payment processing;
- Remotion, FFmpeg/FFprobe, Docker, or media processing;
- broad external beta audience, paid production, production, or final delivery/export unlock.
