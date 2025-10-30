import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArchive } from '../hooks/useArchive';
import type { ArchiveFile } from '../types/archive';
import { Card, Heading, Text, Input } from '../components/ui';

interface FolderNode {
  name: string;
  path: string;
  files: ArchiveFile[];
  subfolders: { [key: string]: FolderNode };
  isExpanded: boolean;
}

function Browse() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    // Restore expanded folders from localStorage
    const saved = localStorage.getItem('browse-expanded-folders');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const { manifest, loading, error } = useArchive();

  // Build folder tree structure
  const folderTree = useMemo((): FolderNode => {
    const root: FolderNode = {
      name: 'Archive',
      path: '',
      files: [],
      subfolders: {},
      isExpanded: true,
    };

    if (!manifest) return root;

    manifest.files.forEach((file) => {
      const pathParts = file.path.split('/');
      let currentNode = root;

      // Skip "box-3" as it's treated as root - start from index 1 if first part is "box-3"
      const startIndex = pathParts[0] === 'box-3' ? 1 : 0;

      // Navigate through folder structure
      for (let i = startIndex; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        // Reconstruct path without box-3 prefix for cleaner paths
        const folderPath = pathParts.slice(startIndex, i + 1).join('/');

        if (!currentNode.subfolders[folderName]) {
          currentNode.subfolders[folderName] = {
            name: folderName,
            path: folderPath,
            files: [],
            subfolders: {},
            isExpanded: expandedFolders.has(folderPath),
          };
        }
        currentNode = currentNode.subfolders[folderName];
      }

      // Add file to the final folder
      currentNode.files.push(file);
    });

    return root;
  }, [manifest, expandedFolders]);

  // Filter files based on search query
  const filteredFiles = useMemo((): ArchiveFile[] => {
    if (!manifest || !searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return manifest.files.filter(
      (file) =>
        file.filename.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        (file.year && file.year.toString().includes(query))
    );
  }, [manifest, searchQuery]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFolderCounts = (
    node: FolderNode
  ): { folders: number; files: number } => {
    const subfolderCount = Object.keys(node.subfolders).length;
    const fileCount = node.files.length;
    return { folders: subfolderCount, files: fileCount };
  };

  const formatFolderCounts = (folders: number, files: number): string => {
    const parts = [];
    if (folders > 0) parts.push(`${folders} folder${folders !== 1 ? 's' : ''}`);
    if (files > 0) parts.push(`${files} file${files !== 1 ? 's' : ''}`);
    return parts.length > 0 ? `(${parts.join(', ')})` : '(empty)';
  };

  const naturalSort = (a: string, b: string): number => {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      // Save to localStorage
      localStorage.setItem(
        'browse-expanded-folders',
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  const renderFolder = (node: FolderNode, level: number = 0) => {
    const hasSubfolders = Object.keys(node.subfolders).length > 0;
    const hasFiles = node.files.length > 0;
    const isExpanded = expandedFolders.has(node.path) || node.path === '';
    const { folders, files } = getFolderCounts(node);

    return (
      <div key={node.path} className={`${level > 0 ? 'ml-4' : ''}`}>
        {/* Folder header */}
        {node.path !== '' && (
          <div
            className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded"
            onClick={() => toggleFolder(node.path)}
          >
            <span className="text-gray-500">
              {hasSubfolders || hasFiles ? (isExpanded ? '📂' : '📁') : '📄'}
            </span>
            <span className="font-medium text-gray-700">{node.name}</span>
            <span className="text-sm text-gray-500">
              {formatFolderCounts(folders, files)}
            </span>
          </div>
        )}

        {/* Contents (when expanded) */}
        {isExpanded && (
          <div className={level > 0 ? 'ml-4' : ''}>
            {/* Subfolders */}
            {Object.values(node.subfolders)
              .sort((a, b) => naturalSort(a.name, b.name))
              .map((subfolder) => renderFolder(subfolder, level + 1))}

            {/* Files */}
            {node.files
              .sort((a, b) => naturalSort(a.filename, b.filename))
              .map((file) => (
                <Link
                  key={file.path}
                  to={`/viewer/${encodeURIComponent(file.path)}`}
                  className="block bg-white border border-gray-200 rounded-lg p-3 mb-2 hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-primary-700 mb-1">
                        {file.filename}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {file.content_type} {file.year ? `• ${file.year}` : ''}{' '}
                        • {formatFileSize(file.size)}
                      </p>
                    </div>
                    <span className="text-primary-600 text-xs font-medium">
                      View →
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Heading as="h1" size="xl" className="mb-8">
        Browse Archive
      </Heading>

      {/* Search input */}
      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search by filename, path, or year..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {/* Content area */}
      {loading && (
        <Card
          variant="default"
          padding="lg"
          className="text-center bg-secondary-50"
        >
          <Text size="lg" color="muted">
            Loading archive...
          </Text>
        </Card>
      )}

      {error && (
        <Card variant="default" padding="lg" className="text-center bg-red-50">
          <Text size="lg" className="text-red-700">
            Error loading archive: {error}
          </Text>
        </Card>
      )}

      {!loading && !error && searchQuery.trim() === '' && (
        <div className="bg-white border border-primary-300 rounded-lg p-4">
          {renderFolder(folderTree)}
        </div>
      )}

      {!loading && !error && searchQuery.trim() !== '' && (
        <div className="space-y-2">
          <Heading as="h2" size="sm" className="text-gray-700 mb-4">
            Search Results ({filteredFiles.length} files found)
          </Heading>
          {filteredFiles.length === 0 ? (
            <Card
              variant="default"
              padding="lg"
              className="text-center bg-secondary-50"
            >
              <Text size="lg" color="muted">
                No files found matching your search.
              </Text>
            </Card>
          ) : (
            filteredFiles.map((file) => (
              <Link
                key={file.path}
                to={`/viewer/${encodeURIComponent(file.path)}`}
                className="block bg-white border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary-700 mb-1">
                      {file.filename}
                    </h3>
                    <p className="text-sm text-black/60 mb-1">{file.path}</p>
                    <p className="text-sm text-black/60">
                      {file.content_type} {file.year ? `• ${file.year}` : ''} •{' '}
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <span className="text-primary-600 text-sm font-medium">
                    View →
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Browse;
