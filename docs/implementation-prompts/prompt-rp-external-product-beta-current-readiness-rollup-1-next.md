# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1 Next Prompt

Use this only after the owner chooses one exact staging migration path.

## Required Owner Decision

One of:

- `APPROVE CLEAN STAGING TARGET`
- `APPROVE FULL REVIEWED STAGING MIGRATION SET APPLY`

If neither exact approval is present, keep `RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1` blocked and do not run SQL, migrations, service-role routes, workers, providers, media processing, signed/public artifact creation, or beta unlock flows.

## Recommended Safe Path

`APPROVE CLEAN STAGING TARGET` is the preferred path because it avoids mutating the currently divergent staging target before the full migration chain and worker/RLS/storage readbacks are proven.
