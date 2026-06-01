# Phase 36G Audio Stack Demucs QA Policy

Required QA gates:

- `tool_routing`: DeepFilterNet, Demucs, and RNNoise responsibilities are
  unambiguous.
- `rnnoise_removal`: RNNoise is not product-routed.
- `demucs_source_evidence`: official Demucs source evidence is recorded.
- `demucs_license_provenance`: pretrained model license/provenance is reviewed.
- `download_runtime_block`: no Demucs download/runtime command is enabled while
  evidence is blocked.
- `controlled_source_scope`: only the approved Phase 32 chain is referenced.
- `privacy_security`: no public access, signed URL, provider, or secret path.
- `blocked_features`: beta, production, broad media, Revideo, FILM, and slow
  motion remain blocked.
- `phase37a_scope`: OCR approval may start only as a separate approval workflow.

The expected Phase 36G result is a blocked Demucs runtime decision unless
pretrained model evidence is clear and permissive.
