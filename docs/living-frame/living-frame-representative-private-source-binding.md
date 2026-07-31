# Living Frame Representative Private Source Binding

## Contract

`living-frame-representative-private-source-binding-v1` is a namespaced,
byte-free source-only candidate. It bridges the existing private finalized
upload authority and canonical source-selection evidence to one exact Living
Frame representative source candidate.

It does not upload, download, transcribe, crop, copy, persist, dispatch, render,
approve, or expose media. It also does not replace the canonical source,
approved-snapshot, MasterTiming, work-graph, asset-manifest, renderer, QA, or
private-review owners.

## Inputs revalidated

- exact `private-upload-media-authority-v1` media and storage records;
- matching tenant, project, upload, media, and storage identities;
- source-media purpose, content type, byte length, and server-computed SHA-256;
- the exact seven-source representative candidate set and candidate digest;
- a transcript-backed video segment, bounded still crop, or cited data rows;
- license, attribution, person/publicity, and documentary fact-safety refs;
- exact approved snapshot, selected scene, MasterTiming, confirmed frame,
  approved work item, and asset-manifest entry refs.

Every reference declares that the canonical owner must reread it. The video
selection consumes source-led analysis only as an opaque versioned digest; this
feature branch does not copy or reinterpret the canonical analysis owner.

## Output boundary

The output carries IDs, media metadata, selection geometry, review refs,
canonical lineage refs, and content-addressed digests. The storage provider
identity is hashed. Bucket, object path, file name, source bytes, URLs, raw
transcript, raw chat, prompts, credentials, commands, and environment are not
serialized.

`canonicalConsumptionPending:true` and every operation, dispatch, runtime,
asset, billing, delivery, and production authority remain false. The smoke is
contract evidence only; it is not evidence that representative source bytes
have been ingested or approved.
