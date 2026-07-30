# Living Frame AuraFace private-local internal test

Status: exact private-local model ingest, atomic read-only mount, and real CPU
inference passed; distributed release and policy gates remain closed.

## Scope

This is the host-specific internal execution proof for Living Frame's sixth
controlled-illustration capability. AuraFace remains a separate, optional CPU
continuity measurement after image generation. It is not a ComfyUI node, a
generation conditioner, an identity verifier, or a likeness-approval system.

The proof uses:

- `glintr100_onnx`: `260,694,151` bytes,
  SHA-256
  `a7933ea5330113b01c9b60351d8f4c33003f145d8470ac5f0e52ee2effe25c60`;
- `scrfd_10g_bnkps_onnx`: `16,923,827` bytes,
  SHA-256
  `5838f7fe053675b1c7a08b633df49e7af5495cee0493c7dcf6697200b85b5b91`;
  and
- one explicitly synthetic, non-public-figure, single-person portrait supplied
  as a private runtime fixture and never committed to Git.

## Executed path

```text
exact private ONNX sources
→ canonical model-artifact repository ingest
→ two simultaneous read-only mount leases
→ fixed network-isolated linux/amd64 CPU container
→ face detection and five-point landmark alignment
→ 512-dimensional reference embedding
→ 512-dimensional candidate embedding
→ safe digest-bound host result
→ before/after model-object verification
→ post-consumer mutation refusal
```

The reference and candidate inputs deliberately use the same synthetic
portrait. The purpose is to prove exact mount, detector, preprocessing, and
embedding execution—not to define a production continuity threshold.

## Confinement and privacy

The mounted runner uses:

- external network disabled;
- read-only root filesystem;
- all Linux capabilities dropped;
- no-new-privileges;
- bounded process, memory, CPU, and temporary-filesystem limits;
- runtime downloads disabled;
- caller threshold rejected; and
- identity approval rejected.

The structured smoke receipt contains model identity codes, byte lengths,
digests, inference booleans, face outcome, and embedding dimensions only. It
does not contain the portrait, embedding values, private paths, mount paths,
URLs, credentials, identity references, thresholds, or likeness decisions.

## Repeatable command

```text
REEDITPRO_AURAFACE_EMBEDDING_MODEL_SOURCE=<exact-glintr100-path>
REEDITPRO_AURAFACE_DETECTOR_MODEL_SOURCE=<exact-scrfd-path>
REEDITPRO_AURAFACE_FICTIONAL_PORTRAIT_SOURCE=<private-synthetic-png>
npm run smoke:living-frame-auraface-canonical-mount-host-session
```

If any exact private input is absent, the smoke reports a structured skip. A
skip is not inference evidence.

## Remaining gates

This proof does not authorize:

- distributed model-artifact mounts;
- package, model-weight, privacy, consent, or commercial approval;
- a universal similarity threshold;
- fairness or demographic calibration;
- real-person identity or likeness approval;
- persistence of embeddings or identity references;
- operation registration or dispatch;
- actual resource-cost evidence;
- customer credits or billing;
- public delivery; or
- production use.

The optional CPU runtime is now executable for private internal testing. Its
release and policy gates remain separate from the two still-open GPU gates:
real ComfyUI selected-scene generation and real SAM2 temporal masking.
