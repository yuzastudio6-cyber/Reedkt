# MP4Box Binary Presence QA

QA accepts PR #738 binary presence evidence:

- `command -v MP4Box` returned `/usr/bin/MP4Box`;
- executable presence was checked under `--network none`;
- no `MP4Box -version` command ran;
- no MP4Box media command ran.

The binary is present in the render-worker image proof, but runtime behavior remains a separate controlled proof gate.
