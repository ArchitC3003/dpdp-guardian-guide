# Presentations and videos in the Content Studio

## What you get
- Two new content types next to Blog post, Article / guide and Landing page: **Presentation** and **Video**.
- **Presentation**: upload a PDF or PowerPoint (.pptx) file. Visitors see the slides in a page viewer on the public site, with a download button you can switch on or off. You can add a cover image, a summary and notes, and set the usual SEO fields.
- **Video**: upload an MP4/WebM file or paste a YouTube/Vimeo link. Visitors see a player with a poster image, a summary and an optional transcript. The transcript helps search engines and AI tools understand the video.
- Both show up on the Learn page with their own badge (for example "Slides" or "Video"), can be filtered by type, use the same topics, tags and authors, and follow the same draft, review, schedule and publish steps as articles.
- In the studio list, the type filter includes the two new types.
- The site map, RSS feed and AI-readable feed list them too. Videos get video details that search engines can read.

## Upload rules
- Presentations: PDF or PPTX, up to 50 MB.
- Videos: MP4 or WebM, up to 200 MB. For anything larger, use a YouTube or Vimeo link.
- Reviewers can upload while writing drafts. Only Super Admins and GRC Managers can publish, which is how it already works.
- Files stay private and are shown through long-lived signed links, the same way cover images work now.

## Technical details
- `ContentType` adds `presentation | video`, along with `TYPE_LABELS` and its Learn filter pills. `publicPath` sends both to `/learn/:slug`.
- Add these columns to `content_posts`, all nullable or with defaults: `media_url text`, `media_kind text` (`pdf|pptx|video_file|youtube|vimeo`), `media_mime text`, `media_size bigint`, `media_duration_seconds int`, `transcript text`, `allow_download boolean default true`. If a check constraint on `content_type` exists, widen it.
- Update `rpc_save_content_post` (and with it the restore path) so it saves the new fields.
- Raise the `content-media` bucket limit from 10 MB to 200 MB. Enforce the type and size limits in the editor. The existing storage policies already cover uploads.
- ContentEditor gets a media panel for each type (file drop or URL field, upload progress, preview) in place of the body editor's main slot. The markdown body stays available for notes.
- LearnArticle renders by type. PDFs use the browser's built-in viewer in an iframe. PPTX shows the cover image, a download link and the Office web viewer embed, using the signed URL. Video files play in `<video>` with a poster. YouTube/Vimeo play in an iframe embed using privacy-enhanced domains.
- JSON-LD: `VideoObject` for videos and `PresentationDigitalDocument` for presentations. `content-feed` includes both types.
- Tests: extend `src/lib/content.test.ts` to cover the new types' `publicPath` and the upload type and size validation (50 MB / 200 MB).

## Out of scope
- Converting PPTX slides to images, video transcoding, auto-generated captions.
