# Living Frame local ComfyUI confinement internal test

Status:
`controlled_non_promotable_local_startup_passed`

Contract:
`living-frame-comfyui-local-confinement-evidence-v1`

## Purpose

This internal test makes the existing model-free local ComfyUI startup
observation reproducible. It does not qualify generation. It verifies that an
exact derived wrapper around the already locked local image can start the
reviewed ComfyUI host under the intended containment rules without accepting
the parent image's root default or direct `main.py` entrypoint.

Run:

```text
npm run smoke:living-frame-comfyui-local-confinement-internal-test
```

The smoke refuses a different parent image. It builds only a small local
derived layer from parent digest
`1de2c0415c477537dc4035a0550cec1859b8e5c5719647a64c0172962a770a64`
with Docker build networking disabled. The derived image declares:

- default UID/GID `65532:65532`;
- a source-controlled Python entrypoint;
- no caller command or argument for the main startup;
- a fixed CPU-only, model-free local launch;
- loopback `127.0.0.1:8188`;
- all custom nodes disabled before the two reviewed node directories are
  whitelisted; and
- a pre-load import guard for `sam2` and `sam2.*`.

## Actual runtime observation

The smoke starts the derived image with:

- Linux `amd64` emulation;
- no network;
- a read-only root filesystem;
- all Linux capabilities dropped;
- no-new-privileges;
- two CPUs;
- 4 GiB memory;
- a 512-process ceiling; and
- one `noexec`, `nosuid`, `nodev` temporary write root.

It does not override the default user or entrypoint and passes no command
arguments. It intentionally injects one test environment variable; the fixed
entrypoint clears the inherited process environment and reconstructs the
allowlisted offline environment before importing ComfyUI. The emitted
environment digest must match the fixed contract.

The running container proves:

- UID/GID `65532:65532`;
- zero effective Linux capabilities;
- no-new-privileges inside PID 1;
- a non-writable root;
- zero mounted model artifacts;
- `sam2` blocked before ComfyUI source loads;
- standard-library imports preserved;
- both reviewed custom nodes loaded rather than silently skipped; and
- a successful bounded `/system_stats` loopback response.

Separate adversarial starts prove that a caller argument fails with code 64
and a root identity override fails with code 65.

The Apple-host CPU-emulated process currently requires Docker's bounded
five-second stop escalation and exits 137 after that deadline. The evidence records
`stopEscalationRequired = true` and keeps a released-process-shutdown gate
open. It does not rewrite that observation as a graceful stop.

## Evidence boundary

The serializable receipt contains only image/source/launch digests,
confinement facts, counts, timestamps, the exit observation, open gates, and
closed authorities. It contains no image bytes, model bytes, prompts, paths,
URLs, credentials, commands, customer data, or artifact payloads.

This evidence proves local containment and startup compatibility only. It
does not prove:

- the clean canonical offline-package layout;
- canonical image-repository admission;
- vulnerability disposition, signature, or provenance attestation;
- released runner override enforcement;
- removal or approved disposition of the inherited direct-VCS distribution;
- any of the five required model artifacts;
- CUDA or NVIDIA L4 execution;
- prompt submission or generated output;
- operation registration or dispatch;
- cost evidence or customer charging;
- asset persistence, alpha preparation, QA approval, private scene review,
  rendering, public delivery, or production readiness.

The canonical fixed L4 process supervisor remains authoritative. This local
compatibility image must not replace it or enter the tool registry, operation
router, work graph, asset manifest, billing path, or production runtime.
