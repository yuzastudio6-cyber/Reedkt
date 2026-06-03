# Phase 46E Caveat Classification

The Phase 46E gate treats the following as internal warnings and external/production blockers:

- FFmpeg/PyAV codec, patent/build, and dynamic library review.
- Sharp/libvips LGPL-2.1-or-later and native binary/platform review.
- DuckDB extension loading, network access, object-store access, and broad file IO.
- Polars memory pressure, CPU/runtime compatibility, and schema drift.
- The Phase 46C controlled suite used exactly one private controlled sample.
- VLM remains blocked and OCR remains internal QA/planning only.

These caveats do not block restricted internal media/data QA/planning if all required evidence and privacy gates pass. They do block production, broad media, external beta, public output, and user-facing analytics.
