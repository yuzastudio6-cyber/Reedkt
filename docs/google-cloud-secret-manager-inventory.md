# Google Cloud Secret Manager Inventory

Implementation date: 2026-06-18.

RP-MODEL-02 defines a safe Secret Manager inventory policy. Inventory is metadata-only and gated.

## Required Gates

Do not inspect Google Cloud Secret Manager unless both gates are present:

- `INSPECT_REEDITPRO_GCLOUD_SECRETS=true`
- `CONFIRM_REEDITPRO_GCLOUD_PROJECT=reeditpro`

The project must be verified as the ReeditPro project before metadata inspection.

## Allowed Metadata

Allowed metadata includes secret names, labels, create/update timestamps, replication policy, and whether expected names exist.

## Forbidden Actions

Never run `gcloud secrets versions access`.

Never print secret values, API keys, service account JSON, tokens, passwords, connection strings, or provider credentials.

## RP-MODEL-02 Result

Current gates are missing, so no `gcloud secrets list` command was run. The implementation creates a blocked metadata-only report and models manual metadata comparison for future safe audits.
