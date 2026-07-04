# External Agent GCP Access Repair Plan

Status: repair-plan only. This packet explains the current GCP read-access blocker for external-agent execution. It does not grant IAM, mutate GCP, create service accounts, create service-account keys, create VMs, invoke Cloud Run, import models, run inference, create generated assets, touch Supabase, execute SQL, create signed URLs, mutate credits, or unlock beta/production.

## Current Blocker

The redacted account-index selector can resolve a local account and refresh tokens, but live preflight still reports:

- `gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing`
- `gcloud_account_lacks_compute_quota_read_access`

Until those read checks pass in `npm run external-agent-tool-blockers:preflight`, external-agent execution remains blocked.

## Account Selection

Agents should use the non-mutating selector instead of changing global gcloud config:

```bash
REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-blockers:preflight
```

The selector maps privately to `CLOUDSDK_CORE_ACCOUNT` only for child gcloud commands. It must not print account values and must not run `gcloud config set account`.

## Required Read Access

| Tool | Current blocker | Required read permissions | Likely minimal role |
| --- | --- | --- | --- |
| `qwen2_5_vl_7b_instruct` | `gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing` | `run.services.get`, `run.jobs.get` | `roles/run.viewer` |
| `ai_video_broll_generation_wan` | `gcloud_account_lacks_compute_quota_read_access` | `compute.projects.get`, `compute.regions.get` | `roles/compute.viewer` |

For Qwen, the selected account must read the project `reeditpro` Cloud Run worker service and private caller job in `us-central1`.

For B-roll, the selected account must read project-level `GPUS_ALL_REGIONS` quota and regional `NVIDIA_L4_GPUS` quota for `northamerica-northeast2`.

## What This Does Not Do

This repair plan does not grant IAM and does not authorize runtime execution. It is a precise target for whoever controls GCP access. After access is repaired, agents must rerun the live preflight and the fail-closed wrappers must still verify their own gates.

## Verification

After GCP access is repaired for a redacted local account candidate, run:

```bash
REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-blockers:preflight
REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-next-command
```

Only if live preflight clears should an agent consider the guarded wrapper command emitted by `npm run external-agent-tool-next-command`.

## Next Prompt

`QWEN2_5_VL_STACK_TOOL_58DQ-GCP-ACCESS-VERIFY: verify selected local gcloud account can read Qwen Cloud Run and B-roll quota, no execution`
