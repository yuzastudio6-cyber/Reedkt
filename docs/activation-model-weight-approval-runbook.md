# Activation Model Weight Approval Runbook

Phase 26 creates the first model-weight/license approval workflow for the
minimal speech/caption scope needed before Phase 28.

The only staging-approved model scope is:

- tool: `faster_whisper`
- runtime: `ctranslate2`
- model candidate: `Systran/faster-whisper-tiny`
- purpose: staging speech/caption test only

Phase 26 does not download model weights by default. It records source URLs,
license evidence, storage policy, and text-only future download command plans.
Model files must never be committed to git.

Run the static workflow:

```bash
npm run activation:model-weight:summary
npm run activation:model-approval:plan
npm run activation:model-approval:report
```

Future model download/load work must use an explicit execution flag, write to
private staging storage or approved runtime paths, record revision/checksums,
and preserve license/attribution notices. Phase 26 does not approve production,
external beta, paid production, providers, GPU deployment, or broad real user
media testing.
