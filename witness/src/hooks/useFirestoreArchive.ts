import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  FlatDocument,
  ArchiveStats,
  FolderTreeNode,
} from '../types/archive';
import {
  buildFolderTreeFromDocuments,
  getTopTagsFromDocuments,
  getDocumentTypeStatsFromDocuments,
} from '../utils/manifestUtils';

/**
 * Shape of a document as stored in Firestore.
 * Populated by the migration script (scripts/migrate-to-firebase.mjs).
 */
interface FirestoreDocumentData {
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
  /** Path within Firebase Storage, e.g. "box-3/folder/file.txt" */
  storageRef: string;
}

function toFlatDocument(data: FirestoreDocumentData): FlatDocument {
  return {
    metadata: {
      file_path: data.path,
      file_name: data.fileName,
      date: {
        document_date: data.date,
        date_source: data.dateSource,
        confidence: data.dateConfidence,
        time_period: data.timePeriod,
      },
      category: {
        tags: data.tags,
        primary_type: data.type,
        confidence: data.typeConfidence,
      },
      summary: data.summary,
    },
    filename: data.fileName,
    path: data.path,
    folderPath: data.folderPath,
    date: data.date,
    year: data.year,
    dateConfidence: data.dateConfidence,
    tags: data.tags,
    type: data.type,
    typeConfidence: data.typeConfidence,
    summary: data.summary,
    textFilePath: data.storageRef,
    analysisFilePath: data.storageRef.replace('.txt', '_analysis.json'),
  };
}

/**
 * Firestore-backed equivalent of useArchive.
 * Returns the same shape so pages require no changes when switching sources.
 *
 * Firestore collections expected:
 *   - `documents`     — one doc per archive file (FirestoreDocumentData)
 *   - `archive/stats` — single document with ArchiveStats fields
 */
export const useFirestoreArchive = () => {
  const [documents, setDocuments] = useState<FlatDocument[]>([]);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsSnapshot, statsDoc] = await Promise.all([
          getDocs(collection(db, 'documents')),
          getDoc(doc(db, 'archive', 'stats')),
        ]);

        setDocuments(
          docsSnapshot.docs.map((d) =>
            toFlatDocument(d.data() as FirestoreDocumentData)
          )
        );

        if (statsDoc.exists()) {
          setStats(statsDoc.data() as ArchiveStats);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const folderTree = useMemo(
    (): FolderTreeNode[] => buildFolderTreeFromDocuments(documents),
    [documents]
  );

  const topTags = useMemo(
    () => getTopTagsFromDocuments(documents, 20),
    [documents]
  );

  const documentTypes = useMemo(
    () => getDocumentTypeStatsFromDocuments(documents),
    [documents]
  );

  return { documents, stats, folderTree, topTags, documentTypes, loading, error };
};
