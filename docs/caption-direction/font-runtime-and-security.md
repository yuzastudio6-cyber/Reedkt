# Font Runtime and Security

Fonts are executable-like binary inputs and licensed creative assets. A filename or family name is not sufficient approval.

## Canonical font registry

Each immutable font asset record should include:

- asset/hash and private object generation identity;
- original and normalized names;
- font format, tables, axes, instances, weights, styles, and version;
- license source, permitted use/embedding, attribution, and review state;
- uploader/workspace/project lineage where custom;
- malware/quarantine and OpenType Sanitizer result;
- FontTools parse/subset result;
- glyph/script/language coverage;
- shaping fixture results;
- renderer compatibility and fallback chain;
- retention/deletion status.

Approved snapshots reference exact immutable font assets, never mutable system-family resolution.

## Intake boundary

Custom uploads require authenticated project scope, size/type limits, create-only private storage, backend byte hashing, quarantine, sanitizer/parser checks, license attestation/review, and no browser/local-path leakage. Malformed, suspicious, unsupported, or license-unknown fonts fail closed.

No runtime worker may download a font or model opportunistically. Production images contain pinned, reviewed dependencies and immutable manifests.

## Layout runtime

FontTools is a candidate for metadata, metrics, variation, glyph coverage, and subsetting. OpenType Sanitizer is a candidate for malformed-font rejection. A qualified shaping stack must match the browser/Remotion/libass paths closely enough for deterministic layout.

Required evidence covers:

- kerning and shaped advance widths;
- ligatures and grapheme clusters;
- RTL/bidi;
- CJK;
- Indic shaping;
- combining marks;
- emoji behavior;
- variable-font axes;
- missing-glyph fallback;
- subset round trip;
- preview/final parity.

## Security and privacy

Font records and binaries stay private unless their license and product policy explicitly allow reuse. User-supplied fonts are not added to a global brand library by default. Logs and public DTOs expose no private paths, signed URLs, font bytes, or uploader details.

Live storage/IAM security remains unverified. Source hardening does not prove deployed GCS or Supabase state.
