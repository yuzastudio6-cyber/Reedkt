# Qwen2.5-VL Cloud Run GPU Source Spec

This directory is the no-build source specification for the future Qwen2.5-VL 7B Cloud Run GPU worker.

It reuses the existing VLM/SGLang runtime boundary and keeps the Qwen path narrow:

- source files only;
- no Docker build;
- no image push;
- no Cloud Run deploy;
- no model weights in the image;
- no dependency install at request time;
- no model import on startup;
- no inference route;
- no provider calls;
- no worker dispatch;
- no Supabase or SQL access;
- no public artifacts or signed URLs;
- no beta or production unlock.

The future service shape remains `minInstances=0`, `maxInstances=1`, `concurrency=1` so the GPU can scale to zero when unused.

The model cache is expected to be supplied later through a private, read-only mount at `/models/qwen2.5-vl-7b-instruct`. This directory does not create buckets, upload objects, mount volumes, or create IAM bindings.
