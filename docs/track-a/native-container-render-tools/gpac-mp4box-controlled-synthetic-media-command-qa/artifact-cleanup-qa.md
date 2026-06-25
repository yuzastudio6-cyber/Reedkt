# Artifact Cleanup QA

QA accepts PR #764 cleanup evidence: the generated SRT and generated subtitle-only MP4 were transient container-local artifacts and were removed before commit.

No SRT, MP4, MKV, media, private artifact, public artifact, signed URL, Docker output, `node_modules`, `dist*`, `.deb`, `.asc`, or `.gpg` artifact is accepted as committed source.
