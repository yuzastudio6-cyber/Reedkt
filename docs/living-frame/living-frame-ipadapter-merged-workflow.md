# Living Frame merged generic IP-Adapter workflow

Status: deterministic, controlled, non-executable graph materialization.

The reviewed generic IP-Adapter contract previously described how three
extension nodes must replace the stock model-to-sampler edge. This contract
materializes that description into one effective graph:

- all validated stock nodes remain;
- `CLIPVisionLoader`, `IPAdapterModelLoader`, and `IPAdapterAdvanced` are
  included from the reviewed extension;
- exactly one direct stock model-to-sampler edge is removed;
- the four reviewed extension edges replace it;
- stock and extension artifact bindings are combined;
- all node, edge, and binding identifiers are unique and non-dangling; and
- a stable topological order proves the effective graph is acyclic.

Both parent contracts are revalidated and checked for mutation. The merged
result contains only digests and graph metadata. It contains no prompt,
reference-image bytes, filename, path, URL, provider/tool identifier, or
executable request.

This is generic IP-Adapter only. FaceID, InsightFace, and AuraFace generation
conditioning remain forbidden. AuraFace stays a separate continuity
measurement path.

Model artifacts, model compatibility, exact dependencies, legal review,
approved reference-image artifacts, network-off confinement, dispatch,
private QA, runtime, and production remain closed under the existing
canonical authorities.
