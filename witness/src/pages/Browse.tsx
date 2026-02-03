import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useArchive } from '../hooks/useArchive';
import { Card, Heading, Text, Input } from '../components/ui';
import { getTagColor, formatDate } from '../utils/manifestUtils';
import { DocumentPreview } from '../components/DocumentPreview';
import type { FlatDocument } from '../types/archive';

function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>(
    searchParams.get('q') || ''
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tag = searchParams.get('tag');
    return tag ? [tag] : [];
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const type = searchParams.get('type');
    return type ? [type] : [];
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('browse-expanded-folders');
    return saved ? new Set(JSON.parse(saved)) : new Set(['box-3']);
  });

  const { documents, folderTree, topTags, documentTypes, loading, error } =
    useArchive();

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedTags.length > 0) params.set('tag', selectedTags[0]);
    if (selectedTypes.length > 0) params.set('type', selectedTypes[0]);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedTags, selectedTypes, setSearchParams]);

  // Search criteria is built inline in the filter logic below

  // Filter documents based on criteria
  const filteredDocuments = useMemo((): FlatDocument[] => {
    if (
      !searchQuery &&
      selectedTags.length === 0 &&
      selectedTypes.length === 0
    ) {
      return [];
    }

    return documents.filter((doc) => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSummary = doc.summary.toLowerCase().includes(query);
        const matchesFilename = doc.filename.toLowerCase().includes(query);
        const matchesPath = doc.path.toLowerCase().includes(query);
        if (!matchesSummary && !matchesFilename && !matchesPath) return false;
      }

      // Tag filter - ALL selected tags must match (AND logic)
      if (selectedTags.length > 0) {
        const docTagsLower = doc.tags.map((t) => t.toLowerCase());
        const allTagsMatch = selectedTags.every((selectedTag) =>
          docTagsLower.some((docTag) => docTag === selectedTag.toLowerCase())
        );
        if (!allTagsMatch) return false;
      }

      // Type filter - ANY selected type can match (OR logic)
      if (selectedTypes.length > 0) {
        if (!selectedTypes.includes(doc.type)) return false;
      }

      return true;
    });
  }, [documents, searchQuery, selectedTags, selectedTypes]);

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery || selectedTags.length > 0 || selectedTypes.length > 0;

  // Calculate preview counts for unselected tags
  const getTagPreviewCount = (tag: string): number => {
    if (selectedTags.includes(tag)) {
      return 0; // Already selected, no preview needed
    }

    // Count how many of the currently filtered documents also have this tag
    return filteredDocuments.filter((doc) => {
      const docTagsLower = doc.tags.map((t) => t.toLowerCase());
      return docTagsLower.some((docTag) => docTag === tag.toLowerCase());
    }).length;
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      localStorage.setItem(
        'browse-expanded-folders',
        JSON.stringify(Array.from(newSet))
      );
      return newSet;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedTypes([]);
  };

  const renderFolderTree = (
    node: import('../types/archive').FolderTreeNode,
    level: number = 0
  ) => {
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children.length > 0;
    const folderDocs = documents.filter((doc) => doc.folderPath === node.path);

    return (
      <div key={node.path} className={level > 0 ? 'ml-4' : ''}>
        {/* Folder header */}
        <div
          className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 cursor-pointer rounded"
          onClick={() => toggleFolder(node.path)}
        >
          <span className="text-gray-500">
            {isExpanded ? '📂' : '📁'}
          </span>
          <span className="font-medium text-gray-700">{node.name}</span>
          <span className="text-sm text-gray-500">
            ({node.documentCount} docs
            {hasChildren && `, ${node.children.length} folders`})
          </span>
        </div>

        {/* Contents (when expanded) */}
        {isExpanded && (
          <div className="ml-4">
            {/* Subfolders */}
            {node.children.map((child) => renderFolderTree(child, level + 1))}

            {/* Files in this folder */}
            {folderDocs
              .sort((a, b) => a.filename.localeCompare(b.filename))
              .map((doc) => (
                <DocumentPreview key={doc.path} doc={doc} compact>
                  <Link
                    to={`/viewer/${encodeURIComponent(doc.path)}`}
                    className="block bg-white border border-gray-200 rounded-lg p-3 mb-2 hover:shadow-md hover:border-primary-300 transition-all"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-primary-700 mb-1 truncate">
                          {doc.filename}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                          {doc.summary}
                        </p>
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-xs text-gray-500">{doc.type}</span>
                          {doc.date && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(doc.date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-primary-600 text-xs font-medium flex-shrink-0">
                        View →
                      </span>
                    </div>
                  </Link>
                </DocumentPreview>
              ))}
          </div>
        )}
      </div>
    );
  };

  const renderDocument = (doc: FlatDocument) => (
    <DocumentPreview key={doc.path} doc={doc}>
      <Link
        to={`/viewer/${encodeURIComponent(doc.path)}`}
        className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all"
      >
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-primary-700 mb-2">{doc.filename}</h3>
            <p className="text-sm text-gray-700 mb-2 line-clamp-3">{doc.summary}</p>
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded">
                {doc.type}
              </span>
              {doc.date && (
                <span className="text-xs text-gray-600">{formatDate(doc.date)}</span>
              )}
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500 truncate">{doc.folderPath}</span>
            </div>
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
                {doc.tags.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{doc.tags.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-primary-600 text-sm font-medium flex-shrink-0">
            View →
          </span>
        </div>
      </Link>
    </DocumentPreview>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <Heading as="h1" size="xl">
          Browse Archive
        </Heading>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
        >
          {showFilters ? 'Hide' : 'Show'} Filters
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <Input
          type="search"
          placeholder="Search by filename, content summary, or path..."
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

        {/* Filter panel */}
        {showFilters && (
          <Card variant="bordered" padding="md">
            <div className="space-y-4">
              {/* Tag filters */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text size="sm" weight="medium">
                    Filter by Tags
                  </Text>
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {topTags.slice(0, 50).map(({ tag, count }) => {
                    const isSelected = selectedTags.includes(tag);
                    const previewCount = hasActiveFilters && !isSelected ? getTagPreviewCount(tag) : null;

                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : getTagColor(tag)
                        }`}
                      >
                        {tag}{' '}
                        {isSelected ? (
                          <span className="opacity-80">({count})</span>
                        ) : previewCount !== null ? (
                          <span className="opacity-80">
                            (→ {previewCount})
                          </span>
                        ) : (
                          <span className="opacity-80">({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type filters */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Text size="sm" weight="medium">
                    Filter by Type
                  </Text>
                  {selectedTypes.length > 0 && (
                    <button
                      onClick={() => setSelectedTypes([])}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {documentTypes.slice(0, 15).map(({ type, count }) => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        selectedTypes.includes(type)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type} ({count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Active filters summary */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-3 border-t">
                  <Text size="sm" color="muted">
                    {filteredDocuments.length} documents found
                  </Text>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}
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

      {!loading && !error && !hasActiveFilters && (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
          {folderTree.map((node) => renderFolderTree(node, 0))}
        </div>
      )}

      {!loading && !error && hasActiveFilters && (
        <div className="space-y-3">
          <Heading as="h2" size="sm" className="text-gray-700 mb-4">
            {filteredDocuments.length === 0
              ? 'No documents found'
              : `${filteredDocuments.length} document${
                  filteredDocuments.length !== 1 ? 's' : ''
                } found`}
          </Heading>
          {filteredDocuments.length === 0 ? (
            <Card
              variant="default"
              padding="lg"
              className="text-center bg-secondary-50"
            >
              <Text size="lg" color="muted" className="mb-2">
                No documents found matching your criteria.
              </Text>
              <button
                onClick={clearFilters}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Clear all filters
              </button>
            </Card>
          ) : (
            filteredDocuments.map((doc) => renderDocument(doc))
          )}
        </div>
      )}
    </div>
  );
}

export default Browse;
