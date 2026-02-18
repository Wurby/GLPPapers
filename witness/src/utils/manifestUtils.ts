/**
 * Utility functions for working with the archive manifest
 */

import type {
  ArchiveManifest,
  FlatDocument,
  DocumentMetadata,
  FolderNode,
  SearchCriteria,
  ArchiveStats,
  FolderTreeNode,
  DateInfo,
} from '../types/archive';

// ============================================================================
// DOCUMENT FLATTENING
// ============================================================================

/**
 * Flatten the folder structure into a single array of documents
 */
export function flattenDocuments(manifest: ArchiveManifest): FlatDocument[] {
  const documents: FlatDocument[] = [];

  Object.entries(manifest.folders).forEach(([folderPath, folder]) => {
    // Strip "input/" prefix from folder path if present
    const cleanFolderPath = folderPath.startsWith('input/')
      ? folderPath.substring(6)
      : folderPath;

    folder.documents.forEach((doc) => {
      documents.push(documentToFlatDocument(doc, cleanFolderPath));
    });
  });

  return documents;
}

/**
 * Convert a DocumentMetadata to a FlatDocument
 */
export function documentToFlatDocument(
  metadata: DocumentMetadata,
  folderPath: string
): FlatDocument {
  const year = extractYear(metadata.date);

  // Strip "input/" prefix from file paths if present
  const cleanPath = metadata.file_path.startsWith('input/')
    ? metadata.file_path.substring(6) // Remove "input/"
    : metadata.file_path;

  const textFilePath = `/archive/${cleanPath}`;
  const analysisFilePath = textFilePath.replace('.txt', '_analysis.json');

  return {
    metadata,
    filename: metadata.file_name,
    path: cleanPath, // Use cleaned path
    folderPath,
    date: metadata.date.document_date,
    year,
    dateConfidence: metadata.date.confidence,
    tags: metadata.category.tags,
    type: metadata.category.primary_type,
    typeConfidence: metadata.category.confidence,
    summary: metadata.summary,
    textFilePath,
    analysisFilePath,
  };
}

/**
 * Extract year from date info
 */
function extractYear(dateInfo: DateInfo): number | null {
  if (!dateInfo.document_date) return null;

  const dateStr = String(dateInfo.document_date);

  // Try YYYYMMDD format (e.g., 19970821)
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.substring(0, 4));
    if (year >= 1900 && year <= 2100) return year;
  }

  // Try YYYY format (e.g., 1997)
  if (dateStr.length === 4) {
    const year = parseInt(dateStr);
    if (year >= 1900 && year <= 2100) return year;
  }

  // Try YY format (e.g., 97 or 24)
  if (dateStr.length === 2) {
    const year = parseInt(dateStr);
    // Assume 00-30 is 2000s, 31-99 is 1900s
    return year <= 30 ? 2000 + year : 1900 + year;
  }

  // Try to parse as ISO date string
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.getFullYear();
  }

  return null;
}

// ============================================================================
// FILTERING & SEARCHING
// ============================================================================

/**
 * Filter documents based on search criteria
 */
export function filterDocuments(
  documents: FlatDocument[],
  criteria: SearchCriteria
): FlatDocument[] {
  return documents.filter((doc) => {
    // Text search in summary
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      const matchesSummary = doc.summary.toLowerCase().includes(query);
      const matchesFilename = doc.filename.toLowerCase().includes(query);
      if (!matchesSummary && !matchesFilename) return false;
    }

    // Filter by tags (OR logic - match any tag)
    if (criteria.tags && criteria.tags.length > 0) {
      const hasMatchingTag = criteria.tags.some((tag) =>
        doc.tags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    // Filter by document types (OR logic - match any type)
    if (criteria.types && criteria.types.length > 0) {
      if (!criteria.types.includes(doc.type)) return false;
    }

    // Filter by date range
    if (criteria.dateRange) {
      const { start, end } = criteria.dateRange;
      if (start && doc.date && doc.date < start) return false;
      if (end && doc.date && doc.date > end) return false;
    }

    // Filter by minimum confidence
    if (criteria.minConfidence) {
      const confidenceLevels: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };
      const docLevel = confidenceLevels[doc.dateConfidence] || 0;
      const minLevel = confidenceLevels[criteria.minConfidence] || 0;
      if (docLevel < minLevel) return false;
    }

    // Filter by folder path
    if (criteria.folderPath) {
      if (!doc.folderPath.startsWith(criteria.folderPath)) return false;
    }

    return true;
  });
}

/**
 * Find related documents by shared tags
 */
export function findRelatedDocuments(
  document: FlatDocument,
  allDocuments: FlatDocument[],
  limit: number = 5
): FlatDocument[] {
  // Calculate relevance score based on shared tags
  const scoredDocs = allDocuments
    .filter((doc) => doc.path !== document.path)
    .map((doc) => {
      const sharedTags = doc.tags.filter((tag) => document.tags.includes(tag));
      return {
        doc,
        score: sharedTags.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scoredDocs.slice(0, limit).map((item) => item.doc);
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate statistics from manifest
 */
export function calculateStats(manifest: ArchiveManifest): ArchiveStats {
  const topTags = Object.entries(manifest.metadata.all_tags)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const documentsPerFolder: Record<string, number> = {};
  Object.entries(manifest.folders).forEach(([path, folder]) => {
    documentsPerFolder[path] = folder.document_count;
  });

  // Calculate coverage percentage
  const coveragePercentage =
    manifest.metadata.total_documents > 0
      ? (manifest.metadata.date_range.documents_with_dates /
          manifest.metadata.total_documents) *
        100
      : 0;

  return {
    totalDocuments: manifest.metadata.total_documents,
    totalFolders: manifest.metadata.total_folders,
    documentTypes: manifest.metadata.document_types,
    topTags,
    dateRange: {
      ...manifest.metadata.date_range,
      coverage_percentage: coveragePercentage,
    },
    documentsPerFolder,
  };
}

/**
 * Get top N tags, normalized and case-insensitive
 * Combines tags that differ only in case (e.g., "LDS" and "lds")
 */
export function getTopTags(
  manifest: ArchiveManifest,
  limit: number = 50
): Array<{ tag: string; count: number }> {
  // Normalize tags - combine case-insensitive duplicates
  const normalizedTags = new Map<string, { originalTag: string; count: number }>();

  Object.entries(manifest.metadata.all_tags).forEach(([tag, count]) => {
    const lowerTag = tag.toLowerCase();
    const existing = normalizedTags.get(lowerTag);

    if (existing) {
      // Combine counts, prefer the tag with more capital letters (usually the canonical form)
      const newCount = existing.count + count;
      const preferredTag = tag.replace(/[a-z]/g, '').length >= existing.originalTag.replace(/[a-z]/g, '').length
        ? tag
        : existing.originalTag;
      normalizedTags.set(lowerTag, { originalTag: preferredTag, count: newCount });
    } else {
      normalizedTags.set(lowerTag, { originalTag: tag, count });
    }
  });

  // Convert back to array and sort by count
  return Array.from(normalizedTags.values())
    .map(({ originalTag, count }) => ({ tag: originalTag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get document type statistics
 */
export function getDocumentTypeStats(
  manifest: ArchiveManifest
): Array<{ type: string; count: number }> {
  return Object.entries(manifest.metadata.document_types)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// ============================================================================
// FOLDER TREE
// ============================================================================

/**
 * Build a folder tree structure for navigation
 */
export function buildFolderTree(manifest: ArchiveManifest): FolderTreeNode[] {
  // Use a flat map to track all nodes by their full path
  const nodeMap = new Map<string, FolderTreeNode>();
  const allPaths = new Set<string>();

  // First pass: create all nodes (including intermediate parents)
  Object.entries(manifest.folders).forEach(([path, folder]) => {
    // Strip "input/" prefix from folder path if present
    const cleanPath = path.startsWith('input/') ? path.substring(6) : path;
    allPaths.add(cleanPath);

    // Create node for this path
    if (!nodeMap.has(cleanPath)) {
      const parts = cleanPath.split('/');
      const name = parts[parts.length - 1];

      nodeMap.set(cleanPath, {
        name,
        path: cleanPath,
        children: [],
        documentCount: folder.document_count,
        isExpanded: false,
      });
    }

    // Create intermediate parent nodes
    const parts = cleanPath.split('/');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/');
      if (!nodeMap.has(parentPath)) {
        nodeMap.set(parentPath, {
          name: parts[i - 1],
          path: parentPath,
          children: [],
          documentCount: 0,
          isExpanded: false,
        });
      }
    }
  });

  // Second pass: build parent-child relationships
  nodeMap.forEach((node, path) => {
    const parts = path.split('/');

    if (parts.length > 1) {
      // This has a parent
      const parentPath = parts.slice(0, -1).join('/');
      const parentNode = nodeMap.get(parentPath);

      if (parentNode) {
        // Check if child isn't already added
        if (!parentNode.children.some((c) => c.path === node.path)) {
          parentNode.children.push(node);
        }
      }
    }
  });

  // Sort function
  const sortTree = (nodes: FolderTreeNode[]): FolderTreeNode[] => {
    return nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({
        ...node,
        children: sortTree(node.children),
      }));
  };

  // Find root nodes (nodes with no parent)
  const roots: FolderTreeNode[] = [];
  nodeMap.forEach((node, path) => {
    const parts = path.split('/');
    if (parts.length === 1) {
      roots.push(node);
    }
  });

  return sortTree(roots);
}

/**
 * Get folder by path
 */
export function getFolder(
  manifest: ArchiveManifest,
  path: string
): FolderNode | null {
  return manifest.folders[path] || null;
}

/**
 * Get all documents in a folder and its subfolders
 */
export function getFolderDocumentsRecursive(
  manifest: ArchiveManifest,
  basePath: string
): FlatDocument[] {
  const documents: FlatDocument[] = [];

  Object.entries(manifest.folders).forEach(([folderPath, folder]) => {
    if (folderPath.startsWith(basePath)) {
      folder.documents.forEach((doc) => {
        documents.push(documentToFlatDocument(doc, folderPath));
      });
    }
  });

  return documents;
}

// ============================================================================
// NAVIGATION
// ============================================================================

/**
 * Get the next document in the current folder
 */
export function getNextDocument(
  currentDoc: FlatDocument,
  documents: FlatDocument[]
): FlatDocument | null {
  // Filter to same folder
  const folderDocs = documents.filter(
    (doc) => doc.folderPath === currentDoc.folderPath
  );

  // Sort by filename
  folderDocs.sort((a, b) => a.filename.localeCompare(b.filename));

  // Find current index
  const currentIndex = folderDocs.findIndex(
    (doc) => doc.path === currentDoc.path
  );

  // Return next document or null if at end
  return currentIndex >= 0 && currentIndex < folderDocs.length - 1
    ? folderDocs[currentIndex + 1]
    : null;
}

/**
 * Get the previous document in the current folder
 */
export function getPreviousDocument(
  currentDoc: FlatDocument,
  documents: FlatDocument[]
): FlatDocument | null {
  // Filter to same folder
  const folderDocs = documents.filter(
    (doc) => doc.folderPath === currentDoc.folderPath
  );

  // Sort by filename
  folderDocs.sort((a, b) => a.filename.localeCompare(b.filename));

  // Find current index
  const currentIndex = folderDocs.findIndex(
    (doc) => doc.path === currentDoc.path
  );

  // Return previous document or null if at beginning
  return currentIndex > 0 ? folderDocs[currentIndex - 1] : null;
}

/**
 * Parse folder path into breadcrumb segments
 */
export function parseBreadcrumbs(
  folderPath: string
): Array<{ name: string; path: string }> {
  const parts = folderPath.split('/');
  const breadcrumbs: Array<{ name: string; path: string }> = [];

  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath = index === 0 ? part : `${currentPath}/${part}`;
    breadcrumbs.push({
      name: part,
      path: currentPath,
    });
  });

  return breadcrumbs;
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date for display
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown date';

  const str = String(dateStr);

  // YYYYMMDD format
  if (str.length === 8 && /^\d{8}$/.test(str)) {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    return `${month}/${day}/${year}`;
  }

  // YYYY format
  if (str.length === 4 && /^\d{4}$/.test(str)) {
    return str;
  }

  // YY format
  if (str.length === 2 && /^\d{2}$/.test(str)) {
    const year = parseInt(str);
    const fullYear = year <= 30 ? 2000 + year : 1900 + year;
    return String(fullYear);
  }

  // Try to parse as date
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString();
  }

  return dateStr;
}

/**
 * Get confidence badge color
 */
export function getConfidenceBadgeColor(
  confidence: 'high' | 'medium' | 'low' | 'none'
): string {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    case 'none':
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get tag color class (deterministic based on tag name)
 * Uses theme colors: primary (brown/terracotta), secondary (gold), and accent colors
 * with sufficient contrast for readability
 */
export function getTagColor(tag: string): string {
  const colors = [
    'bg-primary-200 text-primary-900',     // Rich terracotta
    'bg-primary-300 text-primary-950',     // Deep terracotta
    'bg-secondary-300 text-secondary-900', // Warm gold
    'bg-secondary-400 text-secondary-950', // Rich gold
    'bg-amber-200 text-amber-900',         // Amber
    'bg-orange-200 text-orange-900',       // Soft orange
    'bg-rose-200 text-rose-900',           // Muted rose
  ];

  // Simple hash function for deterministic color selection
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// ============================================================================
// FLAT-DOCUMENT UTILITIES
// Work directly on FlatDocument[] — used by the Firestore data source so it
// can share derived-state logic with the static manifest source.
// ============================================================================

/**
 * Build folder tree from a flat list of documents (no manifest required)
 */
export function buildFolderTreeFromDocuments(
  documents: FlatDocument[]
): FolderTreeNode[] {
  const nodeMap = new Map<string, FolderTreeNode>();
  const folderCounts = new Map<string, number>();

  documents.forEach((doc) => {
    folderCounts.set(doc.folderPath, (folderCounts.get(doc.folderPath) ?? 0) + 1);
  });

  folderCounts.forEach((count, folderPath) => {
    const parts = folderPath.split('/');
    if (!nodeMap.has(folderPath)) {
      nodeMap.set(folderPath, {
        name: parts[parts.length - 1],
        path: folderPath,
        children: [],
        documentCount: count,
        isExpanded: false,
      });
    }
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('/');
      if (!nodeMap.has(parentPath)) {
        nodeMap.set(parentPath, {
          name: parts[i - 1],
          path: parentPath,
          children: [],
          documentCount: 0,
          isExpanded: false,
        });
      }
    }
  });

  nodeMap.forEach((node, path) => {
    const parts = path.split('/');
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parentNode = nodeMap.get(parentPath);
      if (parentNode && !parentNode.children.some((c) => c.path === node.path)) {
        parentNode.children.push(node);
      }
    }
  });

  const sortTree = (nodes: FolderTreeNode[]): FolderTreeNode[] =>
    nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({ ...node, children: sortTree(node.children) }));

  const roots: FolderTreeNode[] = [];
  nodeMap.forEach((_node, path) => {
    if (!path.includes('/')) roots.push(nodeMap.get(path)!);
  });

  return sortTree(roots);
}

/**
 * Get top N tags from a flat list of documents
 */
export function getTopTagsFromDocuments(
  documents: FlatDocument[],
  limit: number = 50
): Array<{ tag: string; count: number }> {
  const tagCounts = new Map<string, { originalTag: string; count: number }>();

  documents.forEach((doc) => {
    doc.tags.forEach((tag) => {
      const lower = tag.toLowerCase();
      const existing = tagCounts.get(lower);
      if (existing) {
        const preferredTag =
          tag.replace(/[a-z]/g, '').length >=
          existing.originalTag.replace(/[a-z]/g, '').length
            ? tag
            : existing.originalTag;
        tagCounts.set(lower, { originalTag: preferredTag, count: existing.count + 1 });
      } else {
        tagCounts.set(lower, { originalTag: tag, count: 1 });
      }
    });
  });

  return Array.from(tagCounts.values())
    .map(({ originalTag, count }) => ({ tag: originalTag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get document type stats from a flat list of documents
 */
export function getDocumentTypeStatsFromDocuments(
  documents: FlatDocument[]
): Array<{ type: string; count: number }> {
  const typeCounts = new Map<string, number>();
  documents.forEach((doc) => {
    typeCounts.set(doc.type, (typeCounts.get(doc.type) ?? 0) + 1);
  });
  return Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate archive stats from a flat list of documents
 */
export function calculateStatsFromDocuments(documents: FlatDocument[]): ArchiveStats {
  const tagCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const folderCounts: Record<string, number> = {};
  const folders = new Set<string>();
  let datedCount = 0;
  let earliest: number | null = null;
  let latest: number | null = null;

  documents.forEach((doc) => {
    doc.tags.forEach((tag) => { tagCounts[tag] = (tagCounts[tag] ?? 0) + 1; });
    typeCounts[doc.type] = (typeCounts[doc.type] ?? 0) + 1;
    folders.add(doc.folderPath);
    folderCounts[doc.folderPath] = (folderCounts[doc.folderPath] ?? 0) + 1;
    if (doc.year !== null) {
      datedCount++;
      if (earliest === null || doc.year < earliest) earliest = doc.year;
      if (latest === null || doc.year > latest) latest = doc.year;
    }
  });

  return {
    totalDocuments: documents.length,
    totalFolders: folders.size,
    documentTypes: typeCounts,
    topTags: Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
    dateRange: {
      earliest: earliest ?? 0,
      latest: latest ?? 0,
      documents_with_dates: datedCount,
      coverage_percentage:
        documents.length > 0 ? (datedCount / documents.length) * 100 : 0,
    },
    documentsPerFolder: folderCounts,
  };
}
