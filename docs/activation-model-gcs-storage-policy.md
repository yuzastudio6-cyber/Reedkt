# Activation Model GCS Storage Policy

Approved Phase 26B storage:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/`

Storage requirements:

- private staging bucket only
- no source-media bucket
- no public ACLs or public IAM bindings
- no signed URL as source of truth
- no model files in git
- retain license/readme files from the model snapshot when present

The generated-assets bucket is used until a dedicated private model-weight
bucket is created in a later phase.
