# Production Audio Artifact Policy

Milestone 9 audio artifacts are private storage references, not signed URLs.

Supported artifact records:

- `audio_analysis_json`
- `cleaned_audio`
- `separated_audio_stem`
- `qa_report`

Source audio and source media are immutable. Cleaned audio and separated stems are new private artifacts and must never overwrite source assets.
