const BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? 'glppapers.firebasestorage.app';
const STORAGE_BASE = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;
const CACHE_TTL_MS = 5 * 60 * 1000;

function storageUrl(path: string): string {
  const encoded = path.split('/').map(encodeURIComponent).join('%2F');
  return `${STORAGE_BASE}/${encoded}?alt=media`;
}

const MANIFEST_URL = storageUrl('manifest.json');

// ── Types (mirrors witness/src/types/archive.ts) ────────────────────────────

export interface DateInfo {
  document_date: string | null;
  date_source: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  time_period: string | null;
}

export interface CategoryInfo {
  tags: string[];
  primary_type: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DocumentMetadata {
  file_path: string;
  file_name: string;
  date: DateInfo;
  category: CategoryInfo;
  summary: string;
}

export interface FolderNode {
  path: string;
  documents: DocumentMetadata[];
  document_count: number;
}

export interface ArchiveManifest {
  metadata: {
    generated_at: string;
    total_documents: number;
    total_folders: number;
    date_range: {
      earliest: number;
      latest: number;
      documents_with_dates: number;
      coverage_percentage: number;
    };
    all_tags: Record<string, number>;
    document_types: Record<string, number>;
  };
  folders: Record<string, FolderNode>;
}

// ── Manifest cache (persists across warm Vercel invocations) ────────────────

let cachedManifest: ArchiveManifest | null = null;
let cacheTime = 0;

export async function getManifest(): Promise<ArchiveManifest> {
  const now = Date.now();
  if (cachedManifest && now - cacheTime < CACHE_TTL_MS) {
    return cachedManifest;
  }
  const res = await fetch(MANIFEST_URL);
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  cachedManifest = (await res.json()) as ArchiveManifest;
  cacheTime = now;
  return cachedManifest;
}

// ── Path helpers ─────────────────────────────────────────────────────────────

/** Strip the "input/" prefix the manifest uses internally. */
export function cleanPath(filePath: string): string {
  return filePath.startsWith('input/') ? filePath.slice(6) : filePath;
}

export function getDocumentUrl(filePath: string): string {
  return storageUrl(cleanPath(filePath));
}

// ── Search ───────────────────────────────────────────────────────────────────

export interface SearchOptions {
  query?: string;
  tag?: string;
  type?: string;
  year?: number;
  limit?: number;
}

export function searchDocuments(
  manifest: ArchiveManifest,
  options: SearchOptions,
): DocumentMetadata[] {
  const { query, tag, type, year, limit = 20 } = options;
  const q = query?.toLowerCase().trim();
  const results: DocumentMetadata[] = [];

  for (const folder of Object.values(manifest.folders)) {
    for (const doc of folder.documents) {
      if (q) {
        const hit =
          doc.summary.toLowerCase().includes(q) ||
          doc.file_name.toLowerCase().includes(q) ||
          doc.category.tags.some((t) => t.toLowerCase().includes(q));
        if (!hit) continue;
      }

      if (tag && !doc.category.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
        continue;
      }

      if (type && doc.category.primary_type.toLowerCase() !== type.toLowerCase()) {
        continue;
      }

      if (year && doc.date.document_date) {
        const docYear = parseInt(doc.date.document_date.slice(0, 4), 10);
        if (docYear !== year) continue;
      }

      results.push(doc);
      if (results.length >= limit) return results;
    }
  }

  return results;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatDocument(doc: DocumentMetadata): string {
  const period = doc.date.time_period ?? doc.date.document_date ?? 'date unknown';
  const tags = doc.category.tags.slice(0, 5).join(', ');
  return [
    `**${doc.file_name}** (${period})`,
    `Type: ${doc.category.primary_type} | Tags: ${tags}`,
    `Path: ${cleanPath(doc.file_path)}`,
    `Summary: ${doc.summary}`,
  ].join('\n');
}
