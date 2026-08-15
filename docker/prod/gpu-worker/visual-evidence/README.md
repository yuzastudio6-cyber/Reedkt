# WeEditPro L4 visual-evidence image

This directory defines the dedicated candidate image for deterministic source
visual evidence used by the `visual_intelligence` specialist. It is cloud-only;
nothing here installs SAM 3.1, PaddleOCR, OpenCV CUDA, or FFmpeg CUDA on a
developer computer.

The candidate runs a fixed six-tool sequence: FFprobe metadata reread, FFmpeg
NVDEC/NVENC private transform, PySceneDetect policy over GPU-computed metrics,
OpenCV CUDA full-timeline measurements, PaddleOCR GPU visible-text evidence,
and fixed high-detail sampling. Media text that resembles an editing command is
recorded as untrusted evidence and is never executed.

The normal L4 route may use this image only after a clean source build produces
an immutable digest and an independent qualification persists exact device,
CUDA, NVDEC/NVENC, OpenCV CUDA, PaddleOCR GPU, full-frame-accounting, and
no-runtime-download evidence. Candidate source alone grants no work, cost, QA,
delivery, or production authority.

The private Cloud Build capsule must provide:

- a hash-locked Python wheelhouse containing PaddleOCR 3.7.0, PaddleX 3.7.0,
  PySceneDetect 0.7.1, their complete application dependency closure, and a
  reviewed OpenCV CUDA/cudacodec build;
- fixed FFmpeg/FFprobe Linux AMD64 binaries plus a CUDA/NVDEC/NVENC receipt;
- reviewed local PP-OCRv6 Medium detection/recognition and text-line
  orientation model directories plus an immutable model manifest;
- no provider credential, SAM checkpoint, or customer media.

Every capsule file—including wheels, native binaries, receipts, and model
files—must appear exactly once in `capsule-manifest.json` with its role, byte
length, and SHA-256. The source-owned verifier rejects symlinks, traversal,
undeclared files, missing roles, credentials/customer-media claims, and digest
mismatches before any package is installed.

The venv intentionally inherits only the base image's pinned GPU PaddlePaddle
3.0.0 runtime. Every other Python application dependency is reinstalled from
the hash-locked capsule, and the build fails unless PaddleOCR/PaddleX resolve to
3.7.0, PaddlePaddle is the CUDA build, and the environment passes `pip check`.

Cloud Run must mount `/mnt/weeditpro-private/l4-visual-evidence` as a bounded
in-memory volume writable only by the runtime identity.
The worker creates one private invocation directory and removes it after the
attempt. Cloud Run job tasks remain user-triggered with zero idle instances.
