/**
 * Archive data types for the GLP Papers digital archive
 */

// ============================================================================
// NEW MANIFEST TYPES (AI-Enhanced Structure)
// ============================================================================

/**
 * Date information extracted by AI with confidence scoring
 */
export interface DateInfo {
  document_date: string | null;
  date_source: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  time_period: string | null;
}

/**
 * Category information with tags and document type
 */
export interface CategoryInfo {
  tags: string[];
  primary_type: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete document metadata including AI analysis
 */
export interface DocumentMetadata {
  file_path: string;
  file_name: string;
  date: DateInfo;
  category: CategoryInfo;
  summary: string;
}

/**
 * Folder node containing documents
 */
export interface FolderNode {
  path: string;
  documents: DocumentMetadata[];
  document_count: number;
}

/**
 * Date range statistics
 */
export interface DateRange {
  earliest: number;
  latest: number;
  documents_with_dates: number;
  coverage_percentage: number;
}

/**
 * Archive metadata and statistics
 */
export interface ArchiveMetadata {
  generated_at: string;
  total_documents: number;
  total_folders: number;
  date_range: DateRange;
  all_tags: Record<string, number>;
  document_types: Record<string, number>;
}

/**
 * Main archive manifest structure
 */
export interface ArchiveManifest {
  metadata: ArchiveMetadata;
  folders: Record<string, FolderNode>;
}

// ============================================================================
// DERIVED/UTILITY TYPES
// ============================================================================

/**
 * Flattened document for easier navigation and filtering
 */
export interface FlatDocument {
  // Original metadata
  metadata: DocumentMetadata;

  // Computed fields for easier access
  filename: string;
  path: string;
  folderPath: string;

  // Date fields
  date: string | null;
  year: number | null;
  dateConfidence: DateInfo['confidence'];

  // Category fields
  tags: string[];
  type: string;
  typeConfidence: CategoryInfo['confidence'];

  // Content
  summary: string;

  // File paths
  textFilePath: string;      // Path to .txt file
  analysisFilePath: string;  // Path to _analysis.json file
}

/**
 * Search/filter criteria
 */
export interface SearchCriteria {
  query?: string;              // Text search in summaries
  tags?: string[];             // Filter by tags (OR logic)
  types?: string[];            // Filter by document types (OR logic)
  dateRange?: {                // Filter by date range
    start: string | null;
    end: string | null;
  };
  minConfidence?: 'low' | 'medium' | 'high';  // Minimum confidence level
  folderPath?: string;         // Filter by folder
}

/**
 * Statistics derived from metadata
 */
export interface ArchiveStats {
  totalDocuments: number;
  totalFolders: number;
  documentTypes: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  dateRange: DateRange;
  documentsPerFolder: Record<string, number>;
}

/**
 * Tree node for folder hierarchy visualization
 */
export interface FolderTreeNode {
  name: string;
  path: string;
  children: FolderTreeNode[];
  documentCount: number;
  isExpanded?: boolean;
}

// ============================================================================
// LEGACY TYPES (For backward compatibility during migration)
// ============================================================================

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
