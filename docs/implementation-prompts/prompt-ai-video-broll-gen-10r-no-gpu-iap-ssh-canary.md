# AI-VIDEO-BROLL-GEN-10R-NO-GPU-IAP-SSH-CANARY

Run one bounded no-public-IP non-GPU IAP SSH canary after 10Q narrowed the 10P blocker to the SSH identity path.

Exact next prompt: `AI-VIDEO-BROLL-GEN-10R-NO-GPU-IAP-SSH-CANARY: run bounded no-public-IP non-GPU IAP SSH canary with the same image, target tag, proof service account, and mandatory cleanup; no GPU/no model/no inference`.

This prompt may create at most one prompt-scoped non-GPU VM only after fresh preflight passes. The VM must use no public IP, the same proof service account, the same IAP target tag, boot disk auto-delete, and the same image family used by 10P. It must exist only long enough to test IAP SSH readiness with a tiny sanitized command, then it must be deleted with cleanup verification.

## Required Source Evidence

- `docs/ai-video-broll-gen-10q-iap-oslogin-access-fix-result.md`
- `docs/ai-video-broll-gen-10p-no-idle-l4-iap-wheelhouse-payload-install-proof-northamerica-northeast2-a-result.md`
- `docs/ai-video-broll-gen-10i-no-idle-l4-iap-wheelhouse-transfer-proof-us-west4-c-result.md`
- `docs/ai-video-broll-generation-gcp-proof-identity-setup-result.md`
- `docs/external-agent-tool-execution-readiness-rollup.md`

## Required Preflight

- Confirm branch state and result evidence are clean.
- Confirm active project `reeditpro` and refresh auth without printing token values.
- Confirm required services are enabled.
- Confirm proof service account is present and active, without storing its email value.
- Confirm IAP firewall is present for source `35.235.240.0/20`, target tag `ai-video-broll-wan-l4-proof`, and TCP `22`.
- Confirm project metadata OS Login and SSH-key posture.
- Confirm local `gcloud` SSH key exists or record if it does not; do not print key material.
- Confirm exact canary VM, disk, address, and reservation are absent before create.
- Confirm no GPU accelerator is requested.

## Allowed Runtime Shape

- canary VM name: `reeditpro-ai-broll-iap-ssh-canary`
- target region: `northamerica-northeast2`
- target zone: `northamerica-northeast2-a`
- accelerator: none
- public IP: forbidden
- target tag: `ai-video-broll-wan-l4-proof`
- service account: existing proof service account only
- image family: same deep learning image family used by 10P
- lifecycle: create, wait for SSH readiness, run a tiny sanitized IAP SSH command, delete, verify absence
- allowed remote command: echo a canary marker and read Python version only

## Failure Handling

If VM creation fails, record the sanitized create failure, verify absence, and do not retry a different zone inside the same prompt.

If IAP SSH fails with `Permission denied (publickey)`, delete the canary, verify absence, and recommend an explicit SSH-key/OS Login metadata fix prompt. Do not create a GPU VM.

If IAP SSH passes, delete the canary, verify absence, and recommend a bounded L4 payload/install retry prompt with mandatory cleanup.

If cleanup fails, do not claim the canary passed.

## Forbidden Actions

- Do not create GPU VMs.
- Do not attach GPUs.
- Do not create public IPs.
- Do not keep the VM idle.
- Do not create more than one canary VM.
- Do not create capacity reservations.
- Do not mutate IAM outside the VM lifecycle allowed by this prompt.
- Do not add OS Login keys unless a later explicit prompt approves it.
- Do not print SSH public keys, private keys, user emails, service-account emails, access tokens, or metadata values.
- Do not transfer wheelhouse payloads.
- Do not install dependencies.
- Do not run Docker.
- Do not import Wan, instantiate a pipeline, run inference, or generate media.
- Do not mutate Supabase, SQL, storage, signed URLs, credits, beta, or production.

## Required Result

Record whether the non-GPU no-public-IP canary created, whether IAP SSH opened, whether cleanup passed, and what the next prompt should be. Keep `gpuVmCreated=false`, `modelImportRun=false`, `modelInferenceRun=false`, `generatedAssetsCreated=false`, and `generatedLocalFixturePassedClaimed=false` regardless of result.
