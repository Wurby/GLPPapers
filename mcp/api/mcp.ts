import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getManifest,
  searchDocuments,
  getDocumentUrl,
  formatDocument,
  cleanPath,
} from '../lib/archive.js';

// ── MCP Protocol constants ────────────────────────────────────────────────────

const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = { name: 'glp-papers', version: '1.0.0' };

// ── Tool descriptors (JSON Schema) ────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_archive',
    description:
      'Search the Glenn L. Pearson Papers archive by keyword. Searches document summaries, filenames, and tags.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search for' },
        limit: { type: 'number', description: 'Max results (default 20, max 50)' },
        tag: { type: 'string', description: 'Narrow by tag, e.g. "personal", "lds", "letter", "family"' },
        type: { type: 'string', description: 'Narrow by document type, e.g. "letter", "journal-entry", "essay"' },
        year: { type: 'number', description: 'Narrow by year, e.g. 1985' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_document',
    description: 'Fetch the full text of a document by its file path. Use the path returned by search_archive or browse_folder.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: { type: 'string', description: 'File path from the archive, e.g. "box-3/FOLDER/file.txt"' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'list_folders',
    description: 'List all folders (collections) in the archive with their document counts, sorted by size.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'browse_folder',
    description: 'List all documents in a specific folder. Use a path returned by list_folders.',
    inputSchema: {
      type: 'object',
      properties: {
        folder_path: { type: 'string', description: 'Folder path from list_folders, e.g. "box-3/CES Redo/1"' },
      },
      required: ['folder_path'],
    },
  },
  {
    name: 'get_archive_stats',
    description: 'Get overall statistics about the Glenn L. Pearson Papers archive — totals, date range, top tags, and document types.',
    inputSchema: { type: 'object', properties: {} },
  },
];

// ── JSON-RPC types ────────────────────────────────────────────────────────────

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface ToolContent {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

// ── Vercel handler ────────────────────────────────────────────────────────────

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health / discovery — let GET return server info
  if (req.method === 'GET') {
    json(res, 200, { ...SERVER_INFO, protocol: PROTOCOL_VERSION });
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readBody(req);
    const result = await dispatch(body);

    if (result === null) {
      // Notification — no response body
      res.writeHead(204);
      res.end();
    } else {
      json(res, 200, result);
    }
  } catch (err) {
    json(res, 500, jsonRpcError(null, -32603, `Internal error: ${String(err)}`));
  }
}

// ── JSON-RPC dispatcher ───────────────────────────────────────────────────────

async function dispatch(body: unknown): Promise<JsonRpcResponse | JsonRpcResponse[] | null> {
  if (Array.isArray(body)) {
    const responses = (await Promise.all(body.map(dispatchOne))).filter(
      (r): r is JsonRpcResponse => r !== null,
    );
    return responses.length > 0 ? responses : null;
  }
  return dispatchOne(body);
}

async function dispatchOne(raw: unknown): Promise<JsonRpcResponse | null> {
  if (!isRequest(raw)) {
    return jsonRpcError(null, -32600, 'Invalid Request');
  }

  const { id, method, params } = raw;

  // Notifications (no id) never get a response
  const isNotification = id === undefined;

  try {
    switch (method) {
      case 'initialize':
        return reply(id ?? null, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        });

      case 'notifications/initialized':
        return null;

      case 'ping':
        return reply(id ?? null, {});

      case 'tools/list':
        return reply(id ?? null, { tools: TOOLS });

      case 'tools/call': {
        const result = await callTool(params);
        return reply(id ?? null, result);
      }

      default:
        if (isNotification) return null;
        return jsonRpcError(id ?? null, -32601, `Method not found: ${method}`);
    }
  } catch (err) {
    if (isNotification) return null;
    return jsonRpcError(id ?? null, -32603, String(err));
  }
}

// ── Tool dispatch ─────────────────────────────────────────────────────────────

async function callTool(params: unknown): Promise<ToolContent> {
  const p = params as { name: string; arguments?: Record<string, unknown> };
  const args = p.arguments ?? {};

  switch (p.name) {
    case 'search_archive': {
      const query = String(args.query ?? '');
      const limit = typeof args.limit === 'number' ? Math.min(args.limit, 50) : 20;
      const tag = args.tag ? String(args.tag) : undefined;
      const type = args.type ? String(args.type) : undefined;
      const year = typeof args.year === 'number' ? args.year : undefined;

      const manifest = await getManifest();
      const results = searchDocuments(manifest, { query, limit, tag, type, year });

      if (results.length === 0) {
        return text(`No documents found matching "${query}".`);
      }
      const body = results.map(formatDocument).join('\n\n---\n\n');
      return text(`Found ${results.length} document${results.length !== 1 ? 's' : ''}:\n\n${body}`);
    }

    case 'get_document': {
      const filePath = String(args.file_path ?? '');
      const url = getDocumentUrl(filePath);
      const response = await fetch(url);
      if (!response.ok) {
        return { content: [{ type: 'text', text: `Could not fetch "${filePath}" (HTTP ${response.status}).` }], isError: true };
      }
      return text(await response.text());
    }

    case 'list_folders': {
      const manifest = await getManifest();
      const folders = Object.values(manifest.folders)
        .map((f) => ({ path: cleanPath(f.path), count: f.document_count }))
        .sort((a, b) => b.count - a.count);
      const lines = folders.map((f) => `${f.path}  (${f.count} documents)`).join('\n');
      return text(`${folders.length} folders:\n\n${lines}`);
    }

    case 'browse_folder': {
      const folderPath = String(args.folder_path ?? '');
      const manifest = await getManifest();
      const rawKey = folderPath.startsWith('input/') ? folderPath : `input/${folderPath}`;
      const folder = manifest.folders[rawKey] ?? manifest.folders[folderPath];

      if (!folder) {
        const sample = Object.keys(manifest.folders).slice(0, 8).map(cleanPath).join('\n');
        return { content: [{ type: 'text', text: `Folder "${folderPath}" not found.\n\nSample folders:\n${sample}` }], isError: true };
      }

      const docs = folder.documents
        .map((doc) => {
          const period = doc.date.time_period ?? doc.date.document_date ?? 'date unknown';
          return `**${doc.file_name}** (${period})\nType: ${doc.category.primary_type} | Path: ${cleanPath(doc.file_path)}`;
        })
        .join('\n\n');

      return text(`${folder.document_count} documents in "${cleanPath(folder.path)}":\n\n${docs}`);
    }

    case 'get_archive_stats': {
      const manifest = await getManifest();
      const m = manifest.metadata;
      const topTags = Object.entries(m.all_tags).sort(([, a], [, b]) => b - a).slice(0, 15)
        .map(([tag, count]) => `  ${tag}: ${count}`).join('\n');
      const topTypes = Object.entries(m.document_types).sort(([, a], [, b]) => b - a).slice(0, 10)
        .map(([type, count]) => `  ${type}: ${count}`).join('\n');

      return text([
        '**Glenn L. Pearson Papers — Archive Statistics**',
        '',
        `Total documents: ${m.total_documents}`,
        `Total folders:   ${m.total_folders}`,
        `Date range:      ${m.date_range.earliest} – ${m.date_range.latest}`,
        `Dated documents: ${m.date_range.documents_with_dates} (${m.date_range.coverage_percentage}% of archive)`,
        '',
        '**Top document types:**',
        topTypes,
        '',
        '**Top tags:**',
        topTags,
      ].join('\n'));
    }

    default:
      throw new Error(`Unknown tool: ${p.name}`);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRequest(v: unknown): v is JsonRpcRequest {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as JsonRpcRequest).jsonrpc === '2.0' &&
    typeof (v as JsonRpcRequest).method === 'string'
  );
}

function reply(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function text(str: string): ToolContent {
  return { content: [{ type: 'text', text: str }] };
}

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    req.on('end', () => {
      try { resolve(raw.length ? JSON.parse(raw) : undefined); }
      catch { resolve(undefined); }
    });
    req.on('error', reject);
  });
}
