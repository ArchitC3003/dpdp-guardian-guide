import { videoEmbed } from "@/lib/content";
import { Download } from "lucide-react";

type MediaPost = { title: string; media_url?: string | null; media_kind?: string | null; media_mime?: string | null; cover_image_url?: string | null; allow_download?: boolean | null };

/** Shows an uploaded presentation (PDF/PPTX) or video (file, YouTube, Vimeo). */
export function MediaViewer({ post }: { post: MediaPost }) {
  const url = post.media_url;
  if (!url) return null;
  const frame = "w-full rounded-xl border border-border bg-card";
  const download = post.allow_download !== false && (post.media_kind === "pdf" || post.media_kind === "pptx") && (
    <a href={url} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-2 text-sm text-primary mt-3"><Download className="h-4 w-4" />Download {post.media_kind === "pdf" ? "PDF" : "slides"}</a>
  );
  if (post.media_kind === "pdf") return <div><iframe src={`${url}#view=FitH`} title={post.title} className={`${frame} aspect-[4/3]`} />{download}</div>;
  if (post.media_kind === "pptx") return (
    <div>
      <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`} title={post.title} className={`${frame} aspect-video`} />
      {download}
    </div>
  );
  if (post.media_kind === "video_file") return <video controls preload="metadata" poster={post.cover_image_url || undefined} className={`${frame} aspect-video`}><source src={url} type={post.media_mime || undefined} /></video>;
  const e = videoEmbed(url);
  if (e) return <iframe src={e.embed} title={post.title} className={`${frame} aspect-video`} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  return null;
}
