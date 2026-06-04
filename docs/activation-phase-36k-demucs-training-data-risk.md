# Phase 36K Demucs Training Data Risk

Demucs pretrained model approval is blocked by training-data provenance, not by source-code license.

Known risk evidence:
- MUSDB18/MUSDB18-HQ includes tracks from DSD100, MedleyDB, Native Instruments, and The Easton Ellises with mixed license and academic-use context.
- MedleyDB-derived tracks include Creative Commons BY-NC-SA 4.0 material.
- Easton Ellises tracks include Creative Commons BY-NC-SA 3.0 material.
- HT Demucs candidates are described as trained on MUSDB-HQ plus an extra training set of 800 songs.
- Torchaudio `HDEMUCS_HIGH_MUSDB_PLUS` references additional internal Meta songs.

Decision: `blocked_pending_training_data_provenance`.
