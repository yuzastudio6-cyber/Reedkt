# Private Local Persistence Hardening — 2026-07-10

Status: `internal_local_boundary_hardened_not_production_storage`

Private internal-test JSON, text, manifest, QA, caption, audio, color,
enhancement, mask, timeline, slow-motion, and render metadata writers now use
`server/security/private-local-persistence.ts`.

The shared boundary provides:

- root confinement with traversal rejection;
- `0700` root and descendant directories, including pre-existing permissive roots;
- `0600` files;
- same-directory temporary files and atomic rename replacement;
- exclusive temporary creation and cleanup;
- create-only owned-directory acquisition with device/inode identity;
- identity-bound directory-tree removal;
- bounded, no-follow regular-directory and flat-file inspection;
- target and parent symlink refusal;
- `O_NOFOLLOW` private reads;
- sorted private-registry listing that rejects symlink and special-file entries,
  followed by no-follow reads for every returned file;
- stream and text/buffer writers; and
- durability sync before replacement.

Canonical private work-graph progress now uses this boundary for immutable,
content-addressed checkpoint records and its checksum-protected atomic latest
pointer. The progress store remains tenant/package/snapshot scoped and exposes
only bounded summaries through journey recovery; it is not a distributed event
store or production queue.

Focused evidence:

```bash
npm run smoke:private-local-persistence
```

The smoke proves restrictive modes, atomic replacement of an existing inode,
temporary cleanup, traversal rejection, target/parent symlink rejection, and
adoption by the named private persistence services.

## Remaining Local Writer Work

The following media/process boundaries cannot be made safe by mechanically
replacing `writeFile`. They create external-process or temporary media outputs
and need directory-FD/sandbox ownership, output verification, and atomic
promotion designs:

- `server/media/ffmpeg-preview.ts`
- `server/workers/audio/ffmpeg-audio-adapter.ts`
- `server/workers/media/ffmpeg-media-adapter.ts`
- `server/workers/smart-cut/smart-cut-preview-runner.ts`
- `server/workers/speech/faster-whisper-command-runner.ts`

The 2026-07-15 large-media proof narrows the `ffmpeg-media-adapter.ts` gap:
returned proxy/audio/frame files are now `0600`, their output directories are
`0700`, and every returned artifact carries backend-computed SHA-256 evidence.
The adapter remains on this list because restrictive post-write modes and
checksums do not by themselves prove directory-FD ownership, subprocess
sandboxing, create-only atomic promotion, or hostile same-UID resistance.

The upload object writer and upload-time probe staging boundary are complete for the current private backend scope. Local object writes are create-only and byte-identical on retry; local and GCS probe reads now flow through their storage adapters into a random, scope-hashed create-only private attempt with exact byte-ceiling and SHA-256 verification before FFprobe. Each attempt owns a newly created directory identity, never adopts a collision, shares concurrent cleanup work, and removes only its original device/inode. Focused evidence proves `0700`/`0600` modes, independent retry attempts, no residual staged files on normal success/failure, size/hash/overrun rejection, retryable operational failure, and ancestor/attempt identity substitution refusal without external mutation.

A separate stopped-request local maintenance boundary now inspects or removes stale attempt directories. It is inspect-only by default, requires at least 24 hours of inactivity, enforces hard traversal/delete limits, skips active/recent/future-dated attempts, fails closed on malformed or non-flat content, revalidates exact identity before deletion, and emits aggregate counts without paths, tenant identifiers, hashes, or filenames. Deletion requires explicit exclusive-root authority and serializes only within one process. This closes bounded single-host orphan recovery evidence; it does not provide distributed locking, deployed retention, shared-storage safety, or protection from a hostile same-UID actor without future dirfd/unlinkat isolation. Run `npm run smoke:private-source-probe-orphan-reconciliation` and see `docs/private-source-probe-orphan-reconciliation-2026-07-13.md`.

FFprobe parser isolation, malware scanning, external-process sandboxing, deployed storage, and real-user media promotion remain separate gates.

The preference compatibility pass is now complete for the current private
backend boundary. Saved Edit Preferences, Exact Edit Preferences, Preference
Intelligence / Preference DNA, and Edit Brief authority all use the shared
symlink-safe reader/writer while preserving their existing paths and persisted
JSON envelopes. Their focused authority smokes prove restrictive modes,
restart-compatible readback, target-symlink refusal, parent-symlink refusal,
and no mutation of the external symlink destination. The shared persistence
smoke also statically prevents these named services from returning to direct
`mkdir`, `writeFile`, or `createWriteStream` persistence.

The authenticated local/private project registry and exact internal edit-state
registry now use the same boundary without changing their hashed object paths
or checksummed JSON envelopes. `smoke:project-state-tenancy` proves restart
readback, user/workspace isolation, stale-write protection, revocation,
`0700`/`0600` modes, exact target-symlink refusal for read and list operations,
and parent-symlink refusal for writes without external mutation. The shared
persistence smoke statically prevents both services from returning to direct
filesystem writers.

The fixed-template private Playwright capture store now uses the shared
create-only/no-follow boundary without changing its deterministic object path or
artifact identity. Focused evidence proves exact-byte restart reuse, concurrent
identical publication, different-byte collision refusal without overwrite,
`0700`/`0600` modes, and target/ancestor-symlink refusal without external
mutation. Arbitrary browser capture remains prohibited; this is only the
existing server-owned zero-network template.

Other project-adjacent stores not named above still require compatibility review
before their storage boundary can be promoted.

The canonical package queue and Cloud dispatch outbox now also use this
boundary with a shared cooperative cross-process lock and transient
write-ahead record. The write-ahead publication atomically commits a
server-selected queue claim plus outbox insert; restart recovery replays either
missing projection and refuses tampered records or projection drift. Focused
evidence proves `0700`/`0600` modes, real two-process claim races, real process
exit after each commit stage, dead-owner recovery, target-symlink refusal,
restart readback, exact concurrent replay, and absence of plaintext claim
credentials or bearer tokens. This remains a cooperative single-host contract;
it is not host-power/filesystem-failure proof, the future distributed database
package-queue/outbox transaction, a shared-filesystem lock, or deployed Google
identity authority. See
`docs/canonical-private-package-state-transaction-verification-2026-07-17.md`.

This hardening is for single-host internal testing. It is not a replacement
for private GCS generation-bound objects, canonical Supabase records, malware
isolation, worker sandboxes, retention policy, or deployed IAM evidence.
