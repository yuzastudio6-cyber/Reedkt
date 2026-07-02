# AI-VIDEO-BROLL-GEN-10Q-IAP-OSLOGIN-ACCESS-FIX

Diagnose and plan the no-public-IP IAP/OS Login access fix after 10P created a `northamerica-northeast2-a` L4 VM successfully but IAP SSH failed with `Permission denied (publickey)`.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10Q-IAP-OSLOGIN-ACCESS-FIX: diagnose and plan no-public-IP IAP/OS Login access after northeast2-a VM create success and publickey failure, no GPU VM/no inference`.

This is a no-GPU-VM/no-inference fix prompt. It must not create a GPU VM, create disks, reserve capacity, add public IPs, mutate firewall/networking/IAM, create service-account keys, run Docker, install dependencies, import Wan, instantiate a model pipeline, run inference, generate media, create generated assets, mutate Supabase, execute SQL, create storage objects, create signed URLs, mutate credits, unlock beta, or unlock production.

## Source Evidence To Read First

- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/ai-video-broll-gen-10o-payload-install-resource-availability-fix-result.md`
- `docs/implementation-prompts/prompt-ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Allowed Checks

- Read-only repo inspection.
- Read-only gcloud auth/config/project checks with token stdout suppressed.
- Read-only OS Login profile and SSH-key listing checks that do not add keys.
- Read-only IAM policy inspection for the active account, proof service account, IAP tunnel role, OS Login role, and service-account user boundary.
- Read-only comparison of 10I successful IAP/SSH posture with 10P failing posture.

## Required Analysis

- Determine whether the failure is most likely missing OS Login IAM role, missing IAP tunnel permission, missing service-account user permission, OS Login key propagation, username mapping, metadata difference, image family difference, or a transient SSH readiness delay.
- Record whether a non-GPU canary is needed before any future L4 proof.
- If a short-lived OS Login key addition is needed, propose it as a later explicit prompt with TTL and cleanup evidence; do not perform it in 10Q.
- Preserve the no-idle rule: do not keep a GPU VM running for access debugging.

## Required Output

- A result doc/spec/smoke that records the no-VM access diagnosis.
- A clear next prompt:
  - If read-only evidence finds a fixable missing role or key posture: recommend an explicit no-GPU access-fix prompt.
  - If read-only evidence is inconclusive: recommend a non-GPU no-public-IP IAP/OS Login canary prompt.
  - If access is proven ready without mutation: recommend a bounded L4 payload/install retry prompt with mandatory cleanup.

## Forbidden Actions

- Do not create Compute Engine VMs.
- Do not create or delete disks.
- Do not add public IPs.
- Do not mutate IAM, OS Login keys, firewall, VPC, or metadata.
- Do not run `gcloud compute ssh` against a GPU VM.
- Do not run Docker.
- Do not install dependencies.
- Do not import models.
- Do not run inference.
- Do not create generated assets.
- Do not touch Supabase or SQL.
- Do not create storage objects or signed URLs.
- Do not mutate credits.
- Do not unlock beta or production.
