# AI Graphics Artifact Scope Mapping

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

## Future Artifact Scope

Future Tool Route AI graphics metadata integration may use only placeholder artifact refs:

- `privateArtifactManifestRef`: required placeholder.
- `privateGcsPathRef`: placeholder only, no upload and no real path.
- `supabaseRowRef`: placeholder only, no mutation.
- `checksumRef`: required placeholder.
- `provenanceRef`: required placeholder.
- `qaEvidenceRef`: required placeholder.
- `cleanupEvidenceRef`: required placeholder.

## Source Of Truth Boundary

Signed URLs are not source of truth. Public artifacts are not source of truth. Raw provider responses, raw prompts, and generated media/render/browser/canvas/WebGL outputs are not source of truth.

The only acceptable future source-of-truth bundle is approved plan snapshot plus scoped tool-call manifest plus private artifact manifest placeholder plus checksum placeholder plus owner proof reference.

## Supabase Classification

- update required: `no write`
- update status: `docs_only`
- environment touched: `none`
- SQL executed: `none`
- migration deployed: `no`
- milestone sync: `not_performed`
