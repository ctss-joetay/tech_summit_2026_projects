---
id: 014
date: 2026-09-15
topic: camera-photo-notes
files_touched: script.js, index.html
decisions:
  - Use a file input with capture=environment to open the device camera directly instead of a gallery/upload picker
  - Compress and shrink photos via canvas to low-quality JPEG before saving because Summit.save caps records at 4KB, trading photo quality for persistence
  - Photos stored per-task alongside notes
open_questions:
  - none
---

Added a camera capture feature to the task notes page, letting users take a photo as proof-of-completion or a reminder directly from their device camera rather than uploading from a gallery. Because the storage layer limits saved records to 4KB, photos are resized and compressed via canvas into low-quality JPEGs before saving, functioning more as thumbnails than full-resolution images. The notes view now shows a photo preview with a remove option, and photos persist per-task across reloads. On devices without a camera, the file input falls back to a normal file picker, which is expected browser behavior.
