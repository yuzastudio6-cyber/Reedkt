# Activation GCP Staging Bucket Policy

Staging buckets are private by default with uniform bucket-level access and public access prevention intended.

Rules:

- no public media by default;
- no `allUsers` or `allAuthenticatedUsers`;
- no signed URL persistence;
- labels include `app=reeditpro` and `env=staging`;
- `worker-temp` uses aggressive lifecycle cleanup;
- QA artifacts use audit/review lifecycle cleanup;
- arbitrary real user media remains blocked.
