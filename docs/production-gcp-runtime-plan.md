# Production GCP Runtime Plan

## Purpose

This plan locks the intended Google Cloud runtime shape for the future ReeditPro production worker system. Milestone 0 does not deploy resources, run `gcloud`, create secrets, build images, call providers, process media, or render video.

## Runtime Topology

| Runtime | Planned shape | Purpose |
| --- | --- | --- |
| Backend API | Cloud Run Service | Authenticated orchestration API for approvals, credit gates, service-role operations, job dispatch, signed access, provider gateway coordination, and status APIs. |
| CPU analysis | Cloud Run Job | Media probe, proxy prep, scene analysis, CPU OCR, image transforms, OTIO export, and analysis artifacts. |
| GPU AI | Cloud Run Job | Transcription acceleration, masks, segmentation, background removal, denoise/separation, enhancement, interpolation, and heavy CV/AI recipes. |
| Render | Cloud Run Job | Hyperframe integration boundary, Remotion composition/render templates, FFmpeg/libass export path, OTIO timeline input, and render artifacts. |
| QA | Cloud Run Job | Visual, audio, caption, color, mask, render/export, policy, and final QA checks. |
| Tool readiness | Cloud Run Job | Safe version/import/capability checks for tools by image and region. |

## Artifact Registry

Future container images should live in Artifact Registry repositories scoped by region and runtime:

- backend API image;
- CPU analysis worker image;
- GPU AI worker image;
- render worker image;
- QA worker image;
- tool readiness worker image.

Images must not contain secrets. Runtime credentials must come from service account identity, Secret Manager bindings, and deployment configuration.

## Private GCS Bucket Purposes

All production media buckets are private by default. Canonical database records should store bucket purpose plus object path, not signed URLs.

| Bucket purpose | Intended contents |
| --- | --- |
| source media | User-uploaded clips, audio, reference media, and immutable source inputs. |
| proxy media | Worker-created lower-resolution proxies, audio extracts, mezzanine intermediates, and analysis-friendly derivatives. |
| analysis artifacts | ffprobe metadata, scene boundaries, technical reports, detected ranges, OCR candidates, and structured analysis outputs. |
| transcripts | Transcript text, word/segment timing, caption draft data, alignment artifacts, and confidence metadata. |
| masks | Segmentation masks, alpha mattes, depth/contact-object groups, mask previews, and mask QA artifacts. |
| generated assets | GPT-image assets, AI video assets, generated SFX/music where approved, cards, keyframes, overlays, and tool-generated assets. |
| previews | Preview renders and placeholder-enabled review outputs. |
| final exports | Final exports, delivery variants, thumbnails tied to export, and release packages. |
| worker temp | Temporary worker intermediates, scratch files, partial outputs, and retry-local artifacts with lifecycle rules. |
| QA artifacts | QA reports, frame grabs, waveforms, plots, masks, diff images, logs, and review manifests. |

Canonical object paths should follow:

```text
workspaces/{workspaceId}/projects/{projectId}/...
```

## Secret Manager

Future backend/worker services should read raw secret values only from Secret Manager or equivalent secure runtime bindings. Planned secret categories:

- Supabase service-role connection values;
- provider API keys and webhook secrets;
- Stripe/billing secrets;
- signed URL or storage signer configuration;
- internal worker auth tokens if required;
- monitoring/error-reporting credentials if required.

Rules:

- Frontend code cannot read secret values.
- Worker payloads cannot contain raw secret values.
- Logs cannot include secrets or signed URLs.
- Database rows may store secret reference names only when needed.

## Service Accounts

| Service account | Least-privilege boundary |
| --- | --- |
| `api_service` | Service-role database operations, job creation, approval/credit orchestration, signed access coordination, no broad media processing by default. |
| `cpu_analysis_worker` | Read source/proxy media, write proxy/analysis/transcript candidates where allowed, update scoped job/events/assets. |
| `gpu_ai_worker` | Read approved inputs, write masks/generated/processed artifacts, update scoped job/events/QA, read only model/provider secrets explicitly needed. |
| `render_worker` | Read approved source/proxy/generated/mask assets, write previews/final exports/temp/QA artifacts, update render/export records. |
| `qa_worker` | Read assets/renders/metadata, write QA artifacts and QA results, update scoped job/events. |
| `tool_readiness_worker` | Read no customer media by default, write readiness reports, inspect container-local tool versions/imports. |

## IAM Boundaries

- Use separate service accounts per runtime group.
- Prefer bucket-purpose scoped permissions over broad storage admin.
- Keep provider secrets away from workers that do not need providers.
- Keep render/export write permissions away from analysis-only workers.
- Keep service-role database mutation behind backend/worker code paths only.
- Use region-specific resources where data residency or latency requires it.
- Add audit logging and monitoring before beta production use.

## GPU Runtime Plan

Starting point:

- `nvidia-l4` Cloud Run Job for `gpu_ai_worker` workloads where Cloud Run GPU support is available and approved.

Future premium option:

- RTX PRO 6000 Blackwell or equivalent premium GPU class where available, cost-approved, region-approved, and product-approved.

GPU availability does not grant permission to run models. Model weights, licenses, privacy, safety, cost, and QA thresholds must pass their own gates.

## Milestone 0 Non-Deployment Gate

This milestone does not:

- deploy Cloud Run services or jobs;
- create or modify GCP resources;
- build or push container images;
- create Secret Manager secrets or versions;
- bind IAM roles;
- process media;
- call providers;
- render previews or exports.
