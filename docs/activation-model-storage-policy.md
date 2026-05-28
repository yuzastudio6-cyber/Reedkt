# Activation Model Storage Policy

Model weights must not be committed to git, baked into source trees, stored in
source-media buckets, exposed publicly, or treated as available without
checksum/revision evidence.

Phase 26 approved staging storage path:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/`

Expected future runtime path:

`/opt/reeditpro/model-weights/faster-whisper/tiny`

The generated-assets bucket is used because the staging foundation does not yet
define a dedicated private model-weight bucket. A future phase may migrate to a
dedicated bucket, but it must remain private, avoid signed URLs as source of
truth, and keep license/manifest evidence intact.
