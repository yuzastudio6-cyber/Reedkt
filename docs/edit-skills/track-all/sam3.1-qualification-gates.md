# SAM 3.1 qualification gates

All gates are conjunctive and content-addressed. A missing gate fails closed.

## Artifact and legal gates

1. Authorized human gated-terms acceptance and legal/commercial-use approval.
2. Exact official source archive and checkpoint ingest into private create-only storage.
3. Byte length, SHA-256, generation/etag reread, malware scan, license reread, and provenance.
4. No runtime download and no third-party mirror substitution.

## Compatibility and image gates

1. Exact pinned source/checkpoint pair.
2. Strict load with zero missing and zero unexpected keys; no guessed rewriting.
3. Real output-shape and deterministic probe.
4. Offline dependency closure, immutable base image and source patch, SBOM, vulnerability scan, signature, provenance, and fixed entrypoint.
5. Driver/CUDA and bfloat16 compatibility.

## Runtime gates

1. A100 real private decode, CUDA inference, output persistence/reread, quality, time, and cost evidence.
2. Equivalent independent L4 evidence only if L4 remains a route.
3. Exact source, range, prompt, object, chunk, bucket, attempt, lease, approval, reservation, and private-output lineage.
4. Session close evidence after success, failure, cancellation, timeout, and reconciliation.
5. Zero public artifacts and zero unauthorized production mutations.

## Route-level status

The current route status is `blocked`: the exact source is pinned, but gated checkpoint access/approval, strict-load compatibility, immutable runtime images, and real A100/L4 evidence are absent. Internal injected fixtures must set `samEvidenceClass: injected_masklets` and cannot promote this route or the top-level skill past the strongest independently proven route set.

TRACK-08 codifies that truth in a strict route-gate report derived from the
repository's canonical source candidate. The report has 11 ordered gates. Only
the exact source/operation authority gate currently passes; the other 10 gates
remain blocked. The deterministic report fixture hash is
`8aef95a45077ed81cf395e6e0443dfb54ab150e1629c24afd740d08e61aee27d`.
It records no checkpoint hash, no strict load, no A100 or L4 inference, zero
SAM requests, and no internal or production execution authority.

The gate schema rejects promotion when actual checkpoint bytes, strict-load
evidence, A100 inference, and all active route gates are not present. An L4
gate can be `not_applicable` only when that fallback is explicitly inactive;
it cannot be skipped while advertised. Evidence marked missing or injected
cannot satisfy a real route gate.
