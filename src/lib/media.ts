/** Helpers for viewing and downloading chat/status media (Cloudinary-backed). */

export function isCloudinaryUrl(url: string) {
  return url.includes("res.cloudinary.com");
}

/**
 * Cloudinary can serve any asset as an attachment with the `fl_attachment`
 * delivery flag. This avoids cross-origin fetch/blob issues entirely, so
 * downloads keep working after refresh and for old messages.
 */
export function downloadUrl(url: string, fileName?: string | null): string {
  if (!isCloudinaryUrl(url)) return url;
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const safeName = (fileName ?? "")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 60);
  const flag = safeName ? `fl_attachment:${safeName}` : "fl_attachment";
  return `${url.slice(0, index + marker.length)}${flag}/${url.slice(index + marker.length)}`;
}

/** Triggers a real file download; falls back to opening the asset in a new tab. */
export async function downloadFile(url: string, fileName?: string | null) {
  const target = downloadUrl(url, fileName);
  try {
    const anchor = document.createElement("a");
    anchor.href = target;
    anchor.download = fileName ?? "download";
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } catch {
    window.open(target, "_blank", "noreferrer");
  }
}

export function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes < 1) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
