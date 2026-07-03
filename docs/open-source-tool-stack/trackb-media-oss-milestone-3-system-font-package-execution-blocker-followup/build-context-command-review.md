# Build Context Command Review

The OCR runtime Dockerfile copies only committed OCR runtime paths and requirements from the repo context. No `dist-server`, `dist-staging-fixture-worker`, `node_modules`, or `npm ci` path was required.

The only approved build command was the local OCR runtime Docker build with the `trackb-milestone3-fonts-noto-cjk-rerun-f739488b207f8959c36579e57280df635e6e87c6` tag.
