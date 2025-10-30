/**
 * Archive data types for the GLP Papers digital archive
 */

export type ContentType =
  | 'journal'
  | 'letter'
  | 'book'
  | 'ces'
  | 'financial'
  | 'unknown';

export interface ArchiveFile {
  filename: string;
  path: string;
  content_type: ContentType;
  year: number | null;
  size: number;
  original_path: string;
}

export interface ArchiveStats {
  by_type: Record<string, number>;
  by_year: Record<string, number>;
}

export interface ArchiveManifest {
  generated_at: string;
  total_files: number;
  files: ArchiveFile[];
  stats: ArchiveStats;
}

export interface FilesByYear {
  [year: number]: ArchiveFile[];
}

export interface FilesByType {
  journals: ArchiveFile[];
  letters: ArchiveFile[];
  books: ArchiveFile[];
  ces: ArchiveFile[];
  financial: ArchiveFile[];
}
