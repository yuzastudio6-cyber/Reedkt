# Binary Fixture Generation v1

## Purpose

Binary fixture generation converts synthetic fixture dry-run artifacts into tiny deterministic JSON, WAV, and PNG files in a temporary workspace. It exists to prove that safe command plans can be paired with concrete private fixture artifacts before any controlled tool execution milestone.

This milestone does not use real user media. It does not execute external tools, run shell commands, dispatch workers, process media, call providers, mutate Supabase, run SQL, create migrations, create signed URLs, unlock beta or production, or mutate `package-lock.json`.

## Node-Only Generation Boundary

The binary fixture generation modules use only Node standard-library APIs:

- stable JSON serialization for JSON payloads and descriptor files
- in-process PCM WAV buffer construction for tiny audio fixtures
- in-process RGBA PNG buffer construction using `node:zlib`, PNG chunks, and internal CRC32 logic
- descriptor JSON for synthetic video fixtures
- `fs.promises.mkdtemp`, `writeFile`, `readFile`, and `rm` for temporary validation writes

The layer intentionally does not import helpers from `server/media`, `server/e2e`, `server/workers`, `server/routes`, storage clients, artifact writers, provider code, Supabase code, FFmpeg wrappers, ImageMagick wrappers, Python wrappers, OpenCV wrappers, PyAV wrappers, PySceneDetect wrappers, or any non-stdlib dependency.

## Generated Artifact Boundary

Binary fixture results may create temporary files under `os.tmpdir()` while diagnostics are running. Those temp files are used only to verify readback checksums and sizes, and are removed before the result is returned when `cleanup: true`.

Returned results never expose temp paths, local output paths, signed URLs, HTTP URLs, shell commands, arbitrary args, service-role context, or provider secrets. They return metadata only:

- deterministic SHA-256 checksum
- byte length
- content type
- fixture kind
- artifact type
- `ProductionStorageBucketPurpose`
- generator name
- safety flags

## Fixture Kinds

JSON generator:

- `synthetic_json`
- `synthetic_timeline`
- `synthetic_caption_segments`
- `synthetic_render_manifest`
- final delivery manifest JSON payloads

WAV generator:

- `synthetic_audio`
- mono 16-bit little-endian PCM
- 8000 Hz sample rate
- maximum 3 seconds
- deterministic tone pattern

PNG generator:

- `synthetic_image`
- `synthetic_mask`
- maximum 320 by 180 RGBA
- deterministic checkerboard or known-region mask pixels

Video descriptor generator:

- `synthetic_video`
- JSON descriptor only
- no MP4, MOV, WebM, stream, or container bytes
- `generatedBinary: false`
- `descriptorOnly: true`
- `binaryMediaGenerated: false`

## Cleanup And Commit Boundary

Generated fixture files are not committed. The diagnostic and runner require temp workspace cleanup for milestone validation. `package-lock.json` must remain unstaged and unchanged from the known hash for this stack.

## No Duplicate Systems

Existing fixture, dry-run, execution, worker, storage, and artifact helpers are scan evidence only. This milestone reuses the existing tool-calling stack and adds only a controlled fixture materialization layer after JSON dry-runs.

It does not create a duplicate production registry, worker router, QA policy, fallback policy, adapter execution layer, safe command policy, fixture catalog, Supabase runtime table, SQL runtime path, or storage writer.

## Next Milestone

Recommended next milestone:

`REEDITPRO-TOOL-CALLING-CONTROLLED-LOW-RISK-TOOL-EXECUTION-1`

That milestone should only proceed after this binary fixture generation layer passes, pending external tools remain excluded, package-lock remains out of scope, and any execution path is fail-closed through existing production runtime boundaries.
