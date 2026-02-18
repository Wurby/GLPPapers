/**
 * Builds the URL for an archive file.
 *
 * - Local / Vercel: uses VITE_ARCHIVE_BASE_URL (e.g. /archive)
 * - Firebase Storage: constructs a signed public URL using the storage bucket
 */
export function getArchiveUrl(filePath: string): string {
  const bucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;

  if (bucket) {
    // Firebase Storage REST URL — slashes in the path must be encoded as %2F
    const encodedPath = filePath
      .split('/')
      .map(encodeURIComponent)
      .join('%2F');
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`;
  }

  const base = import.meta.env.VITE_ARCHIVE_BASE_URL ?? '/archive';
  return `${base}/${filePath}`;
}
