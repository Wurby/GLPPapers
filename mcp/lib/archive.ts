const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'glppapers';
const BUCKET = process.env.FIREBASE_STORAGE_BUCKET ?? 'glppapers.firebasestorage.app';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const STORAGE_BASE = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`;
const CACHE_TTL_MS = 5 * 60 * 1000;

// ── Document type (mirrors Firestore FirestoreDocumentData schema) ─────────────

export interface ArchiveDocument {
  id: string;
  fileName: string;
  path: string;
  folderPath: string;
  date: string | null;
  year: number | null;
  dateConfidence: 'high' | 'medium' | 'low' | 'none';
  dateSource: string;
  timePeriod: string | null;
  tags: string[];
  type: string;
  typeConfidence: 'high' | 'medium' | 'low';
  summary: string;
  content?: string;
  storageRef: string; // path in Firebase Storage, e.g. "box-3/folder/file.txt"
}

// ── Firestore REST response types ─────────────────────────────────────────────

type FsVal =
  | { stringValue: string }
  | { integerValue: string } // integers come as strings
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FsVal[] } }
  | { mapValue: { fields?: Record<string, FsVal> } };

interface FsDoc {
  name: string;
  fields: Record<string, FsVal>;
}

interface FsListResponse {
  documents?: FsDoc[];
  nextPageToken?: string;
}

// ── Firestore field parsers ───────────────────────────────────────────────────

function parseVal(v: FsVal): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values ?? []).map(parseVal);
  if ('mapValue' in v) {
    const out: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(v.mapValue.fields ?? {})) out[k] = parseVal(fv);
    return out;
  }
  return null;
}

function str(f: Record<string, FsVal>, k: string, fallback = ''): string {
  return f[k] ? String(parseVal(f[k]) ?? fallback) : fallback;
}

function strOrNull(f: Record<string, FsVal>, k: string): string | null {
  if (!f[k]) return null;
  const v = parseVal(f[k]);
  return v != null ? String(v) : null;
}

function numOrNull(f: Record<string, FsVal>, k: string): number | null {
  if (!f[k]) return null;
  const v = parseVal(f[k]);
  return typeof v === 'number' ? v : null;
}

function strArr(f: Record<string, FsVal>, k: string): string[] {
  const v = f[k];
  if (!v || !('arrayValue' in v)) return [];
  return (v.arrayValue.values ?? []).map(fv => String(parseVal(fv) ?? ''));
}

function parseDoc(d: FsDoc): ArchiveDocument {
  const f = d.fields;
  return {
    id: d.name.split('/').pop() ?? '',
    fileName: str(f, 'fileName'),
    path: str(f, 'path'),
    folderPath: str(f, 'folderPath'),
    date: strOrNull(f, 'date'),
    year: numOrNull(f, 'year'),
    dateConfidence: (str(f, 'dateConfidence') || 'none') as ArchiveDocument['dateConfidence'],
    dateSource: str(f, 'dateSource'),
    timePeriod: strOrNull(f, 'timePeriod'),
    tags: strArr(f, 'tags'),
    type: str(f, 'type'),
    typeConfidence: (str(f, 'typeConfidence') || 'low') as ArchiveDocument['typeConfidence'],
    summary: str(f, 'summary'),
    content: strOrNull(f, 'content') ?? undefined,
    storageRef: str(f, 'storageRef'),
  };
}

// ── Cache ─────────────────────────────────────────────────────────────────────

let cachedDocs: ArchiveDocument[] | null = null;
let cacheTime = 0;

export async function getDocuments(): Promise<ArchiveDocument[]> {
  const now = Date.now();
  if (cachedDocs && now - cacheTime < CACHE_TTL_MS) return cachedDocs;

  const docs: ArchiveDocument[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${FIRESTORE_BASE}/documents`);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Firestore error: ${res.status}`);

    const data = (await res.json()) as FsListResponse;
    for (const d of data.documents ?? []) docs.push(parseDoc(d));
    pageToken = data.nextPageToken;
  } while (pageToken);

  cachedDocs = docs;
  cacheTime = now;
  return docs;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

export function getDocumentUrl(storageRef: string): string {
  const encoded = storageRef.split('/').map(encodeURIComponent).join('%2F');
  return `${STORAGE_BASE}/${encoded}?alt=media`;
}

// ── Search ────────────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'be', 'been',
  'as', 'it', 'its', 'that', 'this', 'which', 'who', 'what', 'how',
  'when', 'where', 'why',
]);

function tokenize(query: string): string[] {
  const raw = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const filtered = raw.filter((t) => !STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : raw;
}

export interface SearchOptions {
  query?: string;
  tag?: string;
  type?: string;
  year?: number;
  limit?: number;
}

export function searchDocuments(docs: ArchiveDocument[], options: SearchOptions): ArchiveDocument[] {
  const { query, tag, type, year, limit = 20 } = options;
  const tokens = query ? tokenize(query) : [];

  const scored: { doc: ArchiveDocument; score: number }[] = [];

  for (const doc of docs) {
    if (tag && !doc.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
    if (type && doc.type.toLowerCase() !== type.toLowerCase()) continue;
    if (year && doc.year !== year) continue;

    if (tokens.length > 0) {
      const fileName = doc.fileName.toLowerCase();
      const summary = doc.summary.toLowerCase();
      const tags = doc.tags.map((t) => t.toLowerCase());
      const folderPath = doc.folderPath.toLowerCase();
      const content = doc.content?.toLowerCase() ?? '';

      const allMatch = tokens.every(
        (token) =>
          fileName.includes(token) ||
          summary.includes(token) ||
          tags.some((t) => t.includes(token)) ||
          folderPath.includes(token) ||
          content.includes(token)
      );
      if (!allMatch) continue;

      let score = 0;
      for (const token of tokens) {
        if (fileName.includes(token)) score += 3;
        if (tags.some((t) => t.includes(token))) score += 2;
        if (folderPath.includes(token)) score += 2;
        if (summary.includes(token)) score += 1;
        if (content.includes(token)) score += 1;
      }
      scored.push({ doc, score });
    } else {
      scored.push({ doc, score: 0 });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => doc);
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatDocument(doc: ArchiveDocument): string {
  const period = doc.timePeriod ?? doc.date ?? 'date unknown';
  return [
    `**${doc.fileName}** (${period})`,
    `Type: ${doc.type} | Tags: ${doc.tags.slice(0, 5).join(', ')}`,
    `Path: ${doc.path}`,
    `Summary: ${doc.summary}`,
  ].join('\n');
}
