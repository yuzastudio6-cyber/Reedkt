# Phase 46D DuckDB/Polars Consistency Policy

Phase 46D blocks if DuckDB and Polars disagree on core row counts, tool status counts, phase readiness counts, blocker counts, artifact object counts, or beta gate input statuses.

Benign differences must be explicitly recorded before the phase can pass. Unexplained disagreement blocks the media/data beta-readiness gate.
