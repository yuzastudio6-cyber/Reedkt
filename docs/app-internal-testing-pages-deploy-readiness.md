# ReEditPro Internal Testing App Deploy Readiness

## Decision

`app_internal_testing_pages_deploy_readiness_passed_ready_for_manual_pages_workflow`

## Source

This packet prepares the app shell for internal sign-in testing after `/sign-in` landed on `codex/reeditpro-web-ui-shell`.

## Deployment Target

- Manual workflow: `.github/workflows/app-internal-testing-pages-deploy.yml`
- Default source ref: `codex/reeditpro-web-ui-shell`
- Default Vite base path: `/Reedkt/`
- Safe public frontend env:
  - `STAGING_SUPABASE_URL` -> `VITE_SUPABASE_URL`
  - `STAGING_SUPABASE_ANON_KEY` -> `VITE_SUPABASE_ANON_KEY`
- API mode: `mock`

The workflow intentionally does not use `STAGING_SUPABASE_SERVICE_ROLE_KEY`, provider secrets, worker secrets, Google Cloud credentials, Stripe secrets, or any backend-only value.

## Sign-In Test Path

Until `app.reeditpro.com` DNS is configured, the repository-owned test URL is the GitHub Pages deployment URL. The expected route after deployment is:

`https://yuzastudio6-cyber.github.io/Reedkt/sign-in`

When custom app DNS is ready, the same workflow can be run with base path `/`, and the launchpad sign-in button can continue targeting:

`https://app.reeditpro.com/sign-in`

## Boundaries

This readiness step does not deploy backend APIs, run tools, dispatch workers, process media, write Supabase data, sign storage URLs, reserve or spend credits, call providers, enable external beta, or enable production. It only deploys the static frontend shell with browser-safe public Supabase auth configuration.

## Next Gate

`APP_INTERNAL_TESTING_PAGES_DEPLOY_WORKFLOW_RUN_AND_AUTH_READBACK`
