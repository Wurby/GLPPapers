import { useState, useEffect } from 'react';
import type {
  ArchiveManifest,
  ArchiveFile,
  FilesByYear,
  FilesByType,
} from '../types/archive';

export const useArchive = () => {
  const [manifest, setManifest] = useState<ArchiveManifest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await fetch('/archive/manifest.json');
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

  return { manifest, loading, error };
};

export const useArchiveFile = (filePath: string) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/archive/${filePath}`);
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
 * Group files by year
 */
export const groupFilesByYear = (files: ArchiveFile[]): FilesByYear => {
  return files.reduce((acc, file) => {
    if (file.year) {
      if (!acc[file.year]) {
        acc[file.year] = [];
      }
      acc[file.year].push(file);
    }
    return acc;
  }, {} as FilesByYear);
};

/**
 * Group files by content type
 */
export const groupFilesByType = (files: ArchiveFile[]): FilesByType => {
  return files.reduce(
    (acc, file) => {
      const type = file.content_type;
      if (type === 'journal') {
        acc.journals.push(file);
      } else if (type === 'letter') {
        acc.letters.push(file);
      } else if (type === 'book') {
        acc.books.push(file);
      } else if (type === 'ces') {
        acc.ces.push(file);
      } else if (type === 'financial') {
        acc.financial.push(file);
      }
      return acc;
    },
    {
      journals: [],
      letters: [],
      books: [],
      ces: [],
      financial: [],
    } as FilesByType
  );
};
