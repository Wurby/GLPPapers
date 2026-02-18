import { useState, useEffect, useMemo } from 'react';
import { getArchiveUrl } from '../utils/archiveUrl';
import type {
  ArchiveManifest,
  FlatDocument,
  SearchCriteria,
} from '../types/archive';
import {
  flattenDocuments,
  filterDocuments,
  calculateStats,
  buildFolderTree,
  getTopTags,
  getDocumentTypeStats,
} from '../utils/manifestUtils';

/**
 * Main hook for accessing archive data with computed values
 */
export const useArchive = () => {
  const [manifest, setManifest] = useState<ArchiveManifest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await fetch(getArchiveUrl('manifest.json'));
        if (!response.ok) {
          throw new Error('Failed to fetch archive manifest');
        }
        const data: ArchiveManifest = await response.json();
        setManifest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchManifest();
  }, []);

  // Memoized computed values
  const documents = useMemo(
    () => (manifest ? flattenDocuments(manifest) : []),
    [manifest]
  );

  const stats = useMemo(
    () => (manifest ? calculateStats(manifest) : null),
    [manifest]
  );

  const folderTree = useMemo(
    () => (manifest ? buildFolderTree(manifest) : []),
    [manifest]
  );

  const topTags = useMemo(
    () => (manifest ? getTopTags(manifest, 20) : []),
    [manifest]
  );

  const documentTypes = useMemo(
    () => (manifest ? getDocumentTypeStats(manifest) : []),
    [manifest]
  );

  return {
    manifest,
    documents,
    stats,
    folderTree,
    topTags,
    documentTypes,
    loading,
    error,
  };
};

export const useArchiveFile = (filePath: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(getArchiveUrl(filePath));
        if (!response.ok) {
          throw new Error('Failed to fetch file');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [filePath]);

  return { content, loading, error };
};

/**
 * Hook for filtering documents based on criteria
 */
export const useFilteredDocuments = (
  documents: FlatDocument[],
  criteria: SearchCriteria
) => {
  return useMemo(
    () => filterDocuments(documents, criteria),
    [documents, criteria]
  );
};

/**
 * Hook for finding a document by path
 */
export const useDocument = (documents: FlatDocument[], path: string | null) => {
  return useMemo(
    () => documents.find((doc) => doc.path === path) || null,
    [documents, path]
  );
};

/**
 * Hook for getting documents by folder
 */
export const useFolderDocuments = (
  documents: FlatDocument[],
  folderPath: string | null
) => {
  return useMemo(() => {
    if (!folderPath) return documents;
    return documents.filter((doc) => doc.folderPath === folderPath);
  }, [documents, folderPath]);
};

/**
 * Hook for getting documents by tag
 */
export const useDocumentsByTag = (
  documents: FlatDocument[],
  tag: string | null
) => {
  return useMemo(() => {
    if (!tag) return [];
    return documents.filter((doc) => doc.tags.includes(tag));
  }, [documents, tag]);
};

/**
 * Hook for getting documents by year
 */
export const useDocumentsByYear = (
  documents: FlatDocument[],
  year: number | null
) => {
  return useMemo(() => {
    if (!year) return [];
    return documents.filter((doc) => doc.year === year);
  }, [documents, year]);
};

/**
 * Hook for getting documents with dates (for timeline)
 */
export const useDatedDocuments = (documents: FlatDocument[]) => {
  return useMemo(
    () => documents.filter((doc) => doc.date !== null),
    [documents]
  );
};
