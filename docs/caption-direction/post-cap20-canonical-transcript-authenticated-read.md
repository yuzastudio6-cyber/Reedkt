# Post-CAP-20 Canonical Transcript Authenticated Read

Milestone: `POST-CAP-20-CANONICAL-TRANSCRIPT-AUTHENTICATED-READ`

Status: `caption_adapter_frozen_canonical_reader_not_mounted`

Adapter digest:
`4c3ccc50c341ac2f35c87ba9988ebed069734c36713bc7cd825ea2241d9ede2a`.

## Outcome

Caption now has a closed authenticated-read binding for the existing immutable
`caption-canonical-transcript-v1` contract. This closes the Caption-side public
read-adapter gap without creating a transcript provider, persistence reader,
peer dispatcher, or timing owner.

The integration profile now requires two distinct initial-call artifacts for
transcript-dependent jobs:

1. `canonical_transcript`, the exact immutable private transcript artifact;
2. `canonical_transcript_authenticated_read_binding`, the byte-free proof that
   the artifact was reread for the exact approved plan.

Neither input may be replaced by a timing-owner request or browser-local state.

## Binding requirements

`caption-canonical-transcript-authenticated-read-binding-v1` binds:

- owner user, workspace, project, edit session, plan version, and immutable
  approved snapshot;
- the exact transcript ID, version, and recomputed digest;
- exact source-speech evidence and alignment-qualification references;
- the deterministic set of speaker-diarization artifact references;
- canonical persistence-read and authenticated-owner evidence references; and
- explicit private, byte-free, no-authority flags.

The admission parser rereads the complete private transcript separately. It
requires exact tenant and approved-snapshot scope, transcript digest, source
package, alignment qualification, and diarization lineage. A transcript is
accepted only when speaker diarization is either absent for every word or
complete for every word. Partial speaker lineage fails closed.

The binding never serializes transcript text, media bytes, paths, URLs,
credentials, or raw chat.

## Verification

The focused source smoke passes 19 checks. It covers non-diarized and completely
diarized transcripts and rejects stale binding digests, cross-workspace and
cross-snapshot reads, crossed transcript/source refs, partial diarization,
unknown fields, unsafe paths, authority overclaims, inherited fields, and
cycles.

The post-CAP-20 routing smoke additionally proves:

- a transcript ref without its authenticated-read binding is blocked;
- neither missing input is routed to another skill; and
- the planning seam accepts both exact evidence refs when all other declared
  dependencies are present.

No Docker, Python, FFmpeg, Remotion, provider, model, billing, public, or
production action is performed.

## Remaining gate

`authenticatedPrivateResultIntegrated` remains `false`. The canonical backend
still has to persist and reread the actual transcript and binding, then inject
their exact refs into the approved Caption call. The binding alone is not
private-runtime completion evidence.
