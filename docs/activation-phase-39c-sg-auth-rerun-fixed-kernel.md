# Phase 39C-SG-AUTH-RERUN Fixed Kernel Auth Rerun

Phase 39C-SG-AUTH-RERUN is a Track B-only follow-up to PR #110. It does not add a new VLM model, runtime family, GPU class, or media scope.

The phase first proves that GCP can be used noninteractively from the current execution environment. If auth and permission preflight pass, it delegates to the existing Phase 39C-SG-FIXED runner to build fixed SGLang kernel profiles, run Cloud Run L4 import smoke, and run generated synthetic fixture QA only after import smoke passes.

The preflight supports existing active gcloud auth, configured service-account impersonation, explicit `REEDITPRO_GCP_IMPERSONATE_SERVICE_ACCOUNT`, access-token files, `CLOUDSDK_AUTH_ACCESS_TOKEN`, Workload Identity Federation credential files, and attached service account environments. It never prints access tokens, refresh tokens, credential file contents, service-account keys, or authorization headers.

If noninteractive auth fails, the phase stops before Cloud Build. The operator action runbook records the exact required action. Browser login inside Codex and service-account key creation are blocked.

VLM tool-family beta status remains `blocked` unless the fixed-kernel runner imports successfully on Cloud Run L4 and one already staged PR #87 official Qwen candidate passes generated fixture QA. Phase 39D, Phase 39E, provider calls, production, beta, public output, broad media, arbitrary media, new Qwen downloads, non-Qwen candidates, unapproved GPU types, service-account keys, and Track A remain blocked.
