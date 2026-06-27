# RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1

## Summary

Use this after `RP-EXTERNAL-BETA-CONTROLLED-TESTER-UI-FLOW-SMOKE-1` records blocker `blocked_deployed_browser_ui_surface_not_present`.

## Goal

Provide a controlled browser-visible ReEditPro UI surface for the same staging target and tester group, then rerun the UI flow smoke.

## Required Boundaries

- Keep Cloud Run access scoped to `group:external-beta-testers@reeditpro.com`.
- Use `aiediting@reeditpro.com` as the owner-approved controlled tester account unless a later owner packet adds testers.
- Do not grant `allUsers`, `allAuthenticatedUsers`, domain-wide access, broad public access, production service access, worker access, provider/model access, Supabase access, GCS access, billing access, or public artifact access.
- Do not run providers, workers, media processing, FFmpeg/FFprobe, Docker, Remotion, Supabase mutation, SQL, signed/public artifacts, paid billing, production unlock, or final delivery/export as part of simply exposing the UI surface.
- Do not change the already accepted product-flow API evidence.

## Required Outcome

`RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1` now records source readiness `ready_for_controlled_staging_browser_ui_deploy_and_ui_flow_resmoke` after a local compiled-server smoke. The next guarded packet is `RP-EXTERNAL-BETA-DEPLOYED-BROWSER-UI-SURFACE-1R-STAGING-DEPLOY`.

After the updated source is merged and deployed to the existing controlled staging service, rerun:

```bash
REEDITPRO_CONFIRM_EXTERNAL_BETA_CONTROLLED_TESTER_UI_FLOW_SMOKE=true REEDITPRO_EXTERNAL_BETA_TESTER_EMAIL=aiediting@reeditpro.com npm run rp-external-beta-controlled-tester-ui-flow-smoke-1
```

Then record whether `aiediting@reeditpro.com` can reach a browser-visible controlled ReEditPro UI without broadening access or starting backend-required work.
