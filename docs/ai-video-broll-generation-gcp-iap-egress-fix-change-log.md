# AI Video B-roll Generation GCP IAP Egress Fix Change Log

Decision: `ai_video_broll_gen_9j_gcp_iap_egress_fix_iap_enabled_wheelhouse_path_approved_vm_still_blocked`

This change log records the exact scoped movement from AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-2 to AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX.

## Changed

- Enabled `iap.googleapis.com` for the verified `reeditpro` project.
- Re-confirmed `g2-standard-4` with one `nvidia-l4` in `us-central1-b` as the cost-friendly first proof target.
- Re-confirmed regional quota: L4 limit `1`, L4 usage `0`, CPU limit `200`, CPU usage `0`, SSD limit `500` GB, SSD usage `0`.
- Selected the future no-public-IP dependency path: local wheelhouse/dependency bundle transferred over IAP.
- Rejected external-IP proof VM creation while default SSH from `0.0.0.0/0` remains present.
- Kept Cloud NAT as a later alternative only, not approved or created here.
- Added `scripts/validation/ai-video-broll-gen-9j-gcp-iap-egress-fix-diagnostics.mjs`.
- Added package script `ai-video-broll-gen-9j-gcp-iap-egress-fix:diagnostics`.
- Added next prompt `docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-3.md`.

## Not Changed

- No VM was created.
- No disk was created.
- No firewall rule was created or changed.
- No service account or key was created.
- No router or Cloud NAT was created.
- No static address, reservation, custom image, bucket, Artifact Registry image, Cloud Run job, or quota request was created.
- No dependency install, wheelhouse build, virtual environment, model import, model load, inference, media processing, generated frame, or generated video was run.
- No Supabase, SQL, provider, worker, storage upload, signed URL, public artifact, credit, beta, production, runtime-readiness, `dry_run_passed`, or `generated_local_fixture_passed` path was unlocked.

## Result

```json ai-video-broll-gen-9j-gcp-iap-egress-fix-change-log
{
  "phase": "AI-VIDEO-BROLL-GEN-9J-GCP-IAP-EGRESS-FIX",
  "decision": "ai_video_broll_gen_9j_gcp_iap_egress_fix_iap_enabled_wheelhouse_path_approved_vm_still_blocked",
  "sourceBranch": "codex/ai-video-broll-gen-9j-vm-preflight-2",
  "sourceCommit": "a14d671",
  "filesAdded": [
    "docs/ai-video-broll-generation-gcp-iap-egress-fix-result.md",
    "docs/ai-video-broll-generation-gcp-iap-egress-fix-change-log.md",
    "docs/implementation-prompts/prompt-ai-video-broll-gen-9j-vm-preflight-3.md",
    "scripts/validation/ai-video-broll-gen-9j-gcp-iap-egress-fix-diagnostics.mjs"
  ],
  "filesModified": [
    "package.json"
  ],
  "gcpMutation": {
    "executed": true,
    "scope": "enable_iap_googleapis_com",
    "projectId": "reeditpro",
    "iapApiEnabledAfter": true
  },
  "dependencyPathDecision": {
    "selectedPath": "local_wheelhouse_transfer_over_iap",
    "selectedPathApproved": true,
    "selectedPathReadyNow": false
  },
  "blockedRuntimeActions": {
    "vmCreated": false,
    "cloudNatCreated": false,
    "dependencyInstallRun": false,
    "wheelhouseCreated": false,
    "modelImportRun": false,
    "modelInferenceRun": false,
    "generatedVideoCreated": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "signedUrlsCreated": false,
    "publicArtifactsCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false
  },
  "nextPrompt": "AI-VIDEO-BROLL-GEN-9J-VM-PREFLIGHT-3: re-check controlled L4 proof VM readiness, no inference"
}
```
