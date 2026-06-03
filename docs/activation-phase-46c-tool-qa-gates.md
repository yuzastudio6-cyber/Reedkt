# Phase 46C Tool QA Gates

Required core gates:

- approved sample evidence passes
- private object copy and SHA-256 verification pass
- PyAV metadata/probe passes
- OpenCV bounded frame metrics pass for six approved offsets
- DuckDB aggregation passes
- Polars transform passes
- storage/privacy gates pass
- private artifact upload passes or Phase 46C remains blocked

PySceneDetect and Sharp/libvips can be warning-only if their bounded runtime or
privacy path is limited, as long as the core gates pass and the warning is
recorded. Any unbounded scene detection or public/committed thumbnail path is a
blocker.
