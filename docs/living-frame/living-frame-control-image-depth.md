# Living Frame deterministic depth control image

Status: controlled reference pixel primitive; no depth estimation, artifact,
tool route, or runtime authority.

This primitive converts an already-derived, source-bound `Uint16Array` depth
packet into a deterministic opaque RGBA control image. Larger depth values are
treated as nearer and rendered brighter. The mapping uses the full unsigned
16-bit range, equal RGB channels, and an opaque alpha channel.

The source artifact, packet identity, packet digest, output frame, measured
RGBA digest, processing profile, and bounded metrics are retained. Raw depth
samples and pixels remain process-bound and are not serialized in the report.
The verifier recomputes the packet digest, raster, metrics, and report.

This is not a depth model and does not infer geometry. A future canonical
source-evidence authority must supply and revalidate the depth packet. A
structurally valid report cannot establish that the samples are truthful,
current, safe, or suitable for a selected scene.

The output may later be bound to the existing stock ControlNet graph
expectation, but canonical artifact creation, QA, asset-manifest lineage,
checkpoint resolution, dispatch, and runtime remain closed.
