# Walkthrough Evidence

Run ID: `2026-06-27T18-18-53-455Z-ea8106e0`

Output directory: `/tmp/reeditpro-rp-external-beta-named-invited-tester-walkthrough-1/2026-06-27T18-18-53-455Z-ea8106e0`

Named invited tester: `aiediting@reeditpro.com`

Cloud Run service: `reeditpro-staging-api`

Cloud Run revision: `reeditpro-staging-api-00006-6gw`

Cloud Run service URL: `https://reeditpro-staging-api-4wkjiqvdqa-uc.a.run.app`

Cloud Run invoker boundary: `group:external-beta-testers@reeditpro.com`

Cloud Run `allUsers` grant: `false`

Cloud Run `allAuthenticatedUsers` grant: `false`

Named tester group membership: `present`

Active auth account: `aiediting@reeditpro.com`

Identity token printed: `false`

Identity token persisted: `false`

Browser route checks:

- unauthenticated `/`: `blocked_403`
- authenticated `/`: `passed_200_html`
- authenticated `/dashboard`: `passed_200_html`
- authenticated `/projects`: `passed_200_html`
- authenticated `/editor`: `passed_200_html`
- SPA JS/CSS asset fetches: `passed`

Product/API readback:

- authenticated `/api/routes`: `200`
- authenticated `/api/runtime/status`: `200`
- route execution mode: `safe_get_readback_only`

Artifacts:

- `named-invited-tester-walkthrough-report.json`: `7152` bytes, SHA-256 `66d46b5c1e0e6200f431f8ea2a2397d49874bac490928716853a86ee1598c2f6`
- `artifact-manifest.json`: `434` bytes, SHA-256 `3a10d4df623785e961ec0c69e4b86bab9e361a16d32ac345b662af09dd859875`

Generated artifacts committed: `none`
