# Docker Build Runtime Proof

Built local image `reeditpro-tracka-gpac-mp4box-controlled-runtime-proof-1:20260625T1147Z-3ed9e38` from `docker/prod/render-worker/Dockerfile`.

Image ID: `sha256:b9050399119a28535aa576573390fe520dbf0bb8e15474d962e8d9c36d8688fe`

The build used only required Dockerfile inputs: `dist-server`, `dist-remotion-worker`, `dist-staging-fixture-worker`, and `dist-staging-real-video-export-worker`. `npm ci` and the build-context commands ran to satisfy Docker `COPY` inputs only. They are not accepted as Remotion execution, render/export, or product runtime proof.

`package-lock.json` stayed unchanged at SHA-256 `8a19532a335a579a29ec6819c6aa2460b9dd7b3edf1cecdfa33d79d634d3b023`.

No image push or deploy occurred.
