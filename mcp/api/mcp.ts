import type { IncomingMessage, ServerResponse } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import {
  getManifest,
  searchDocuments,
  getDocumentUrl,
  formatDocument,
  cleanPath,
} from '../lib/archive.js';

// Vercel passes Node's IncomingMessage / ServerResponse directly for ESM functions
export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  // CORS — allow any MCP client to connect
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no sessions needed
  });

  res.on('close', () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

// ── MCP server definition ────────────────────────────────────────────────────

function buildServer(): McpServer {
  const server = new McpServer({
    name: 'glp-papers',
    version: '1.0.0',
  });

  // ── search_archive ──────────────────────────────────────────────────────────
  server.tool(
    'search_archive',
    'Search the Glenn L. Pearson Papers archive. Searches document summaries, filenames, and tags. Returns matching documents with metadata and file paths.',
    {
      query: z.string().describe('Keyword or phrase to search for'),
      limit: z.number().int().min(1).max(50).optional().default(20).describe('Max results (default 20, max 50)'),
      tag: z.string().optional().describe('Narrow by tag, e.g. "personal", "lds", "letter", "family"'),
      type: z.string().optional().describe('Narrow by document type, e.g. "letter", "journal-entry", "essay"'),
      year: z.number().int().optional().describe('Narrow by year, e.g. 1985'),
    },
    async ({ query, limit, tag, type, year }) => {
      const manifest = await getManifest();
      const results = searchDocuments(manifest, { query, tag, type, year, limit });

      if (results.length === 0) {
        const filters = [
          query && `query="${query}"`,
          tag && `tag="${tag}"`,
          type && `type="${type}"`,
          year && `year=${year}`,
        ]
          .filter(Boolean)
          .join(', ');
        return {
          content: [{ type: 'text', text: `No documents found matching ${filters}.` }],
        };
      }

      const body = results.map(formatDocument).join('\n\n---\n\n');
      return {
        content: [{
          type: 'text',
          text: `Found ${results.length} document${results.length !== 1 ? 's' : ''}:\n\n${body}`,
        }],
      };
    },
  );

  // ── get_document ────────────────────────────────────────────────────────────
  server.tool(
    'get_document',
    'Fetch the full text of a document by its file path. Use the path returned by search_archive or browse_folder.',
    {
      file_path: z.string().describe('File path from the archive, e.g. "box-3/FOLDER/file.txt"'),
    },
    async ({ file_path }) => {
      const url = getDocumentUrl(file_path);
      const response = await fetch(url);

      if (!response.ok) {
        return {
          content: [{
            type: 'text',
            text: `Could not fetch "${file_path}" (HTTP ${response.status}). Check the path is correct — use search_archive or browse_folder to find valid paths.`,
          }],
          isError: true,
        };
      }

      const text = await response.text();
      return { content: [{ type: 'text', text }] };
    },
  );

  // ── list_folders ────────────────────────────────────────────────────────────
  server.tool(
    'list_folders',
    'List all folders (collections) in the archive with their document counts, sorted by size.',
    {},
    async () => {
      const manifest = await getManifest();
      const folders = Object.values(manifest.folders)
        .map((f) => ({ path: cleanPath(f.path), count: f.document_count }))
        .sort((a, b) => b.count - a.count);

      const lines = folders.map((f) => `${f.path}  (${f.count} documents)`).join('\n');
      return {
        content: [{ type: 'text', text: `${folders.length} folders:\n\n${lines}` }],
      };
    },
  );

  // ── browse_folder ───────────────────────────────────────────────────────────
  server.tool(
    'browse_folder',
    'List all documents in a specific folder. Use a path returned by list_folders.',
    {
      folder_path: z.string().describe('Folder path from list_folders, e.g. "box-3/CES Redo/1"'),
    },
    async ({ folder_path }) => {
      const manifest = await getManifest();

      // Support both raw ("input/box-3/...") and clean ("box-3/...") paths
      const rawKey = folder_path.startsWith('input/') ? folder_path : `input/${folder_path}`;
      const folder = manifest.folders[rawKey] ?? manifest.folders[folder_path];

      if (!folder) {
        const sample = Object.keys(manifest.folders)
          .slice(0, 8)
          .map(cleanPath)
          .join('\n');
        return {
          content: [{
            type: 'text',
            text: `Folder "${folder_path}" not found.\n\nSample of valid folders:\n${sample}`,
          }],
          isError: true,
        };
      }

      const docs = folder.documents
        .map((doc) => {
          const period = doc.date.time_period ?? doc.date.document_date ?? 'date unknown';
          return `**${doc.file_name}** (${period})\nType: ${doc.category.primary_type} | Path: ${cleanPath(doc.file_path)}`;
        })
        .join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `${folder.document_count} documents in "${cleanPath(folder.path)}":\n\n${docs}`,
        }],
      };
    },
  );

  // ── get_archive_stats ───────────────────────────────────────────────────────
  server.tool(
    'get_archive_stats',
    'Get overall statistics about the Glenn L. Pearson Papers archive — totals, date range, top tags, and document types.',
    {},
    async () => {
      const manifest = await getManifest();
      const m = manifest.metadata;

      const topTags = Object.entries(m.all_tags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([tag, count]) => `  ${tag}: ${count}`)
        .join('\n');

      const topTypes = Object.entries(m.document_types)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([type, count]) => `  ${type}: ${count}`)
        .join('\n');

      const text = [
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
      ].join('\n');

      return { content: [{ type: 'text', text }] };
    },
  );

  return server;
}
