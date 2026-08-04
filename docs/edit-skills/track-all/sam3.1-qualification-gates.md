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
