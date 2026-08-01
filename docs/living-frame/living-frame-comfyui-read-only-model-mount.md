# Living Frame ComfyUI read-only model source presentation

Status: controlled local source-presentation evidence; distributed GPU mount
and model inference remain closed.

Living Frame now consumes the existing canonical single-use read-only
model-artifact lease for each verified ComfyUI model role. The adapter first
revalidates the exact five-role repository binding, then asks the shared mount
authority to present each immutable source to one process-bound
`comfyui.private-inference` consumer.

For every role, the shared authority:

- fully verifies the repository object before presentation;
- derives the mount alias on the server rather than accepting one from a
  caller;
- requires the Google Cloud Run GPU target and CUDA;
- forbids CPU fallback, runtime downloads, and network fetches;
- consumes the lease once; and
- fully verifies the object again after the consumer returns.

The persisted result includes only artifact identities and lease/consumption
digests. It contains no host path, mount alias, credential, URL, filename, or
model bytes.

The atomic mounted-runner contract now also binds a fixed runtime-confinement
requirement into the session digest. A backend runner must receive and attest:

- exact UID/GID `65532:65532`, supplied by either the released image default
  or an exact platform-enforced override;
- non-root execution;
- a read-only root filesystem;
- all Linux capabilities dropped;
- no-new-privileges;
- blocked external network and runtime downloads;
- read-only model mounts; and
- ephemeral-only writable operation roots.

A runner result reporting root, a different identity, or any relaxed
confinement field is rejected before a canonical session result is exposed.
The current smoke proves that fail-closed source contract with controlled
ports. It does not prove that a released L4 platform applied the settings.

This evidence is deliberately narrower than a runnable GPU mount. The current
canonical repository is a single-host integrity primitive; it does not prove
private GCS distribution or a read-only Cloud Run container mount. The
consumer contract also carries literal-false model-execution authority.

Production still requires exact bundle compatibility and paid-use approval,
canonical operation-owned artifact admission, a signed worker image,
distributed private mounting, an approved scene/snapshot/work attempt, GPU
inference, output capture and QA, observed attempt-cost evidence, and private
review.
