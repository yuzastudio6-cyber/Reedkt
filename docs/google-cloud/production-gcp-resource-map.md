# Production GCP Resource Map

## Runtime Resources

| Resource | Planned name/source | Purpose |
| --- | --- | --- |
| Backend API | `reeditpro-api` Cloud Run Service | Backend orchestration, approved snapshot loading, job dispatch, status APIs, and secret-backed runtime config. |
| CPU analysis worker | `reeditpro-cpu-analysis-worker` Cloud Run Job | Media probe/proxy/analysis, scene data, CPU OCR where practical, and analysis artifacts. |
| GPU AI worker | `reeditpro-gpu-ai-worker` Cloud Run Job | Future approved GPU AI recipes such as transcription, masks, segmentation, denoise, enhancement, and interpolation. |
| Render worker | `reeditpro-render-worker` Cloud Run Job | Remotion/render templates, FFmpeg/libass export path, OTIO input, and render artifacts. |
| QA worker | `reeditpro-qa-worker` Cloud Run Job | Visual/audio/caption/color/mask/render/export QA. |
| Tool readiness worker | `reeditpro-tool-readiness-worker` Cloud Run Job | Version/import/capability checks without customer media by default. |
| Artifact Registry | `${GCP_ARTIFACT_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REEDITPRO_ARTIFACT_REPOSITORY}` | Future container images. |
| GCS buckets | `reeditpro-${REEDITPRO_ENV}-${GCP_PROJECT_ID}-{purpose}` | Private storage by bucket purpose. |
| Secret Manager | placeholder names only | Runtime secret references, no values in source. |

## Bucket Purposes

- `source-media`
- `proxy-media`
- `analysis-artifacts`
- `transcripts`
- `masks`
- `generated-assets`
- `previews`
- `final-exports`
- `worker-temp`
- `qa-artifacts`

## Service Accounts

- `reeditpro-api-sa`
- `reeditpro-cpu-worker-sa`
- `reeditpro-gpu-worker-sa`
- `reeditpro-render-worker-sa`
- `reeditpro-qa-worker-sa`
- `reeditpro-tool-readiness-sa`

## Source Of Truth

The typed non-secret resource contract is `server/config/gcp-production-config.ts`.
