# Phase 36H DeepFilterNet Linux Runtime Policy

Phase 36H-LINUX may execute only the approved private DeepFilterNet v0.5.6 Linux x86_64 musl binary and `DeepFilterNet3_onnx.tar.gz` model archive from Phase 36B/36C metadata. The runtime must verify:

- CLI SHA-256: `70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da`
- Model archive SHA-256: `c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616`
- Aggregate SHA-256: `eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b`

No PyPI runtime fallback, alternate DeepFilterNet version, alternate model, Demucs model, source-separation runtime, VLM runtime, OCR runtime, provider call, public URL, or arbitrary media path is allowed.

The image build context must exclude media/audio/video payloads, model binaries/archives, caches, secrets, environment files, node modules, venvs, logs, and private artifacts. The runtime copies approved private objects from GCS inside the job after confirmations and checksum verification.
