# Production Readiness Review

## Purpose

Production readiness review ensures ReeditPro does not accidentally ship tools, model routes, worker plans, or preview components before they are legally, technically, operationally, and privacy-safe for production.

This review is not legal advice. It is a structured checklist for future legal, security, business, and engineering review.

## Review Dimensions

- Licensing
- Commercial use
- Attribution
- Redistribution / bundling
- SaaS/server-side use
- Security
- Privacy
- User authorization
- Data retention
- Provider terms
- Worker/runtime isolation
- Frontend bundle impact
- Performance
- Accessibility
- Reliability/fallback
- QA coverage
- Credit/billing safety
- Model tier policy
- Export/render readiness

## Tool Classes

- `frontend_browser_tool`: installed in the browser bundle or lazy-loaded frontend. Current examples are D3, ECharts, MapLibre GL, Turf, and lottie-web. These need license, bundle, and performance review.
- `worker_tool`: executes only in future backend/worker environments. Examples include FFmpeg, OpenCV, OpenColorIO, OpenImageIO, Playwright, Essentia, librosa, whisper.cpp, Rubber Band, and VapourSynth. These need runtime, security, privacy, and license review.
- `provider_model`: external AI/API model such as GPT-Image-2, Wan, Hailuo, or Veo. These are not open-source tools and must respect provider terms, pricing, safety, tier routing, approval, and credits.
- `planning_only_tool`: known to the planner but not installed or executed. Safe as planning metadata only.
- `future_evaluation_tool`: under consideration and blocked from execution until reviewed.

## Production Readiness Statuses

- `planning_only`
- `frontend_preview_ready`
- `internal_dev_only`
- `needs_license_review`
- `needs_security_review`
- `needs_privacy_review`
- `needs_performance_review`
- `needs_worker_architecture`
- `approved_for_prototype`
- `approved_for_production`
- `blocked`

## Blocking Production Rules

A tool or model route should be blocked if:

- license or commercial use is unclear
- production usage terms are not reviewed
- it requires secrets in the frontend
- it bypasses approval or credits
- it executes before an approved snapshot
- it violates Basic/Pro no Veo
- it treats Veo as default or primary
- it uses browser capture without source authorization
- it may expose private user data without redaction/privacy planning
- it adds heavy frontend bundle impact without lazy loading/performance planning
- it uses worker-only tools in the frontend
- it lacks QA/fallback policy for production execution

## Approval Path Before Production

Before production execution, each tool should have:

- license review owner/status
- commercial use review
- security review
- privacy review when handling user/source data
- runtime architecture
- worker isolation plan for backend tools
- performance/bundle review for frontend tools
- QA checks
- fallback policy
- credit impact policy
- user-facing explanation when needed

## Installed Frontend Tools

D3, ECharts, MapLibre GL, Turf, and lottie-web are installed for local browser-safe previews and future controlled preview components.

They are not production rendering yet. Lazy loading is recommended, no external map tiles/APIs should be called in preview by default, no user action should be required by these installs, and installed frontend tools must not bypass approval or credit policy.

## Worker-Only Tools

FFmpeg, OpenCV, OpenColorIO, OpenImageIO, Playwright, Essentia, librosa, whisper.cpp, Rubber Band, and VapourSynth are worker-only or future tools.

They are not installed in the frontend and do not execute in this repo milestone. Production use requires worker architecture, license review, security review, and privacy review where applicable.

## Provider Models

GPT-Image-2, Wan, Hailuo, and Veo are provider models, not open-source tools.

Model routing remains:

- Wan is primary.
- Hailuo is fallback/alternate.
- Veo is Premium-only final fallback/rescue.
- Basic and Pro never use Veo.
- Veo is never primary/default.

## Non-Goals

This document does not approve legal use, make final license claims, install tools, execute tools, implement workers, implement billing, or implement provider clients.
