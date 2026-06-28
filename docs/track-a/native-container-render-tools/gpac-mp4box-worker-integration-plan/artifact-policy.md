# GPAC/MP4Box Worker Integration Artifact Policy

Future GPAC/MP4Box worker integration must keep artifacts private and manifest-first.

Required future artifact controls:
- private input manifest with file names, source class, byte counts, SHA-256 checksums, and owner authorization;
- private artifact manifest with output file names, byte counts, SHA-256 checksums, command template id, cleanup status, and QA status;
- no public artifact creation;
- no signed URL creation as source-of-truth;
- no final render/export handoff until a later product route and QA gate approves it;
- cleanup status recorded on success and failure.

Generated artifacts committed in this phase: `none`.
