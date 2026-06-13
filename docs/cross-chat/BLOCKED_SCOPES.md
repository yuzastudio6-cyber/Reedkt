# Blocked Scopes

The post-merge source-of-truth verification keeps these scopes blocked:

- production release
- external beta
- paid production
- general worker execution
- tool execution
- route execution
- provider calls
- media processing and broad media runtime
- Track B media tool runtime, including OpenCV, PyAV, PySceneDetect, Sharp/libvips, PaddleOCR, PaddlePaddle, DuckDB, and Polars
- Sound/Music/Audio runtimes, including DeepFilterNet, Signalsmith Stretch, and Demucs
- AI Tools creative graphics execution
- Track A runtime execution
- Docker, Cloud Run, or Cloud Build mutation
- Supabase writes, SQL, migrations, reset, repair, or production promotion
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- beta or production unlocks

Blocked means no owner should treat the frozen-batch merge or this verification as runtime/product execution approval.
