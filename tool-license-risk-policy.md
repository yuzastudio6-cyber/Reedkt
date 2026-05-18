# Tool License Risk Policy

## Purpose

License risk policy gives ReeditPro a structured way to mark tools as safe, uncertain, risky, or blocked for production.

This document is not legal advice. Final production decisions require legal/business review.

## License Risk Levels

- `low`: permissive or commonly SaaS-compatible after review; still requires attribution/compliance checks.
- `medium`: license has conditions, attribution, notices, or bundling considerations.
- `high`: license or dependency chain may affect commercial distribution, SaaS usage, or worker deployment.
- `blocked`: cannot be used in production until legal review clears it.
- `unknown`: not reviewed.

## License Review Fields

Every tool should track:

- declared license label if known from package metadata or docs
- license risk
- commercial use status
- attribution required
- redistribution/bundling concern
- SaaS/server-side concern
- GPL/copyleft concern
- patent/trademark concern
- source URL/reference placeholder
- review owner
- review status
- last reviewed date
- notes

## Special Handling Categories

Frontend packages should review npm package license, transitive dependencies, bundle implications, and attribution.

Worker binaries should review build configuration, linking/distribution model, server-side execution terms, and whether binaries are distributed to users or used internally only.

Provider models/APIs should review provider terms, usage restrictions, pricing/credit mapping, and content/safety policies.

Browser capture should review target site permissions, avoid restriction bypass, and avoid capturing private/sensitive data without explicit approval.

## Tools Requiring Special Review

Do not make final legal conclusions. Mark these as requiring review where appropriate:

- FFmpeg build/configuration and optional components
- Rubber Band
- Playwright browser capture workflows
- MapLibre style/tile sources
- map data/tile providers
- OpenCV worker usage
- OpenColorIO/OpenImageIO worker use
- provider model/API terms
- font, icon, and media assets used in templates

## Production Rule

A tool marked `needs_license_review`, `high`, `unknown`, or `blocked` cannot be used in production execution until approved. Planning metadata may reference it, but workers should not execute it.
