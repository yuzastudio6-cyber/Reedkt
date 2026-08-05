# Canonical Caption postapproval planning execution

Status: private/internal source mount complete; rendered media and terminal QA
remain blocked

The canonical private job adapter now recognizes approved work owned by
`canonical_caption_specialist_worker_v1`. It derives the operation from the
immutable work item, rereads the approved snapshot and execution package, and
uses the existing worker lease, artifact manifest, private artifact QA, and
reconciliation owners. Caption does not receive a parallel queue, dispatcher,
asset manifest, cost owner, or final-QA owner.

For an assignment that can finish from its approved byte-free inputs, the
runner:

- persists and rereads the exact Caption call/result pair through the shared
  specialist-resume repository;
- starts and completes the canonical internal execution fence;
- writes one create-only private JSON planning receipt for the exact planned
  manifest entry;
- records the existing private artifact and QA evidence; and
- reconciles the result as private-test evidence only.

If Caption returns `needs_followup`, `blocked`, `unsupported`, or `failed`, the
runner does not manufacture a completed asset. Its call/result record remains
available for HQ-mediated support, the dependency preflight stops before a
worker lease is claimed or an approved attempt is consumed, and the canonical
job remains incomplete. This is especially important for authenticated
transcript, Visual Intelligence, Track All, SoundSync, B-roll, and Living Frame
evidence.

The local create-only JSON object port used by this path has exact-byte replay,
collision refusal, bounded private paths, and post-write reread. It is a
single-host internal-testing store, not distributed or production durability.

This closes `caption_postapproval_artifact_execution`. Three internal pipeline
gates remain:

1. bind actual rendered Caption media work and its manifest assets;
2. mount the canonical postrender qualified visual-QA writer/result lifecycle;
3. bind independent Caption private review before terminal qualification.

No media, provider, model, cloud, public delivery, production, billing, wallet,
or settlement authority is granted by this milestone.
