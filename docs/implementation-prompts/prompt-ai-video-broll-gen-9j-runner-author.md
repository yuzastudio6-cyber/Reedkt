# AI-VIDEO-BROLL-GEN-9J-RUNNER-AUTHOR Fail-Closed Private L4 Proof Runner Prompt

Goal: add the committed fail-closed runner file approved by AI-VIDEO-BROLL-GEN-9J-RUNTIME-SETUP. This is no VM/no inference. Do not create a VM, install dependencies, transfer model weights, import the model, instantiate a pipeline, run inference, create generated frames, create generated video, run FFmpeg, mutate Google Cloud, touch Supabase, call providers, dispatch workers, or claim beta/production readiness.

Create only a static/fail-closed runner and diagnostics, using the approved path:

```text
server/workers/ai-video-broll-controlled-install/run_wan_l4_private_tabletop_proof.py
```

The runner must:

- default to refusing execution unless a future execution prompt provides an explicit local proof flag;
- validate argument shape for `--offline-model-cache`, `--fixture`, `--max-runtime-minutes`, `--output-dir`, and `--evidence-json`;
- require offline environment variables;
- reject public URLs, signed URL tokens, service account key paths, provider keys, raw chat prompts, user media paths, and output paths outside `/tmp/reeditpro-private-proof-output`;
- reject model cache paths outside `/tmp/reeditpro-private-model-cache`;
- preserve the approved model and revision only;
- include no hard-coded credentials;
- include no network downloads;
- include no provider calls;
- include no Supabase or SQL code;
- include no worker dispatch code;
- include no FFmpeg or media-processing command;
- include no automatic dependency install;
- remain safe to static-lint without model dependencies installed.

The prompt should also add diagnostics that validate the runner source as text only. Do not run the runner against model weights. Do not import `torch`, `diffusers`, `transformers`, or any model runtime module in diagnostics.

Expected next prompt if the runner source validates:

`AI-VIDEO-BROLL-GEN-9J-RETRY-2: controlled L4 private proof with approved runner, bounded VM/non-user fixture`
