import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArchiveFile, useArchive, useDocument } from '../hooks/useArchive';
import { useMemo } from 'react';
import { processText } from '../utils/textProcessor';
import { Card, Heading, Text, Button } from '../components/ui';
import {
  getTagColor,
  formatDate,
  getConfidenceBadgeColor,
  getNextDocument,
  getPreviousDocument,
  parseBreadcrumbs,
  findRelatedDocuments,
} from '../utils/manifestUtils';

function Viewer() {
  const { filePath } = useParams<{ filePath: string }>();
  const navigate = useNavigate();
  const decodedPath = filePath ? decodeURIComponent(filePath) : '';
  const { content, loading: contentLoading, error } = useArchiveFile(decodedPath);
  const { documents, loading: manifestLoading } = useArchive();

  const currentDoc = useDocument(documents, decodedPath);

  const navigation = useMemo(() => {
    if (!currentDoc || documents.length === 0) {
      return { prev: null, next: null };
    }
    return {
      prev: getPreviousDocument(currentDoc, documents),
      next: getNextDocument(currentDoc, documents),
    };
  }, [currentDoc, documents]);

  const relatedDocs = useMemo(() => {
    if (!currentDoc || documents.length === 0) return [];
    return findRelatedDocuments(currentDoc, documents, 5);
  }, [currentDoc, documents]);

  const breadcrumbs = useMemo(() => {
    if (!currentDoc) return [];
    return parseBreadcrumbs(currentDoc.folderPath);
  }, [currentDoc]);

  const loading = contentLoading || manifestLoading;

  const processedContent = useMemo(() => {
    if (!content) return '';
    return processText(content, {
      stripHeaders: true,
      wrapLines: false,
      decodeChars: true,
    });
  }, [content]);

  if (!filePath) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card variant="default" padding="lg" className="text-center bg-red-50">
          <Text size="lg" className="text-red-700 w-full">
            No file specified
          </Text>
          <Link
            to="/browse"
            className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 hover:decoration-primary-500 focus:text-primary-800 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm mt-4 inline-block"
          >
            Go to Browse
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-black/60 flex flex-wrap items-center gap-2">
        <Link to="/" className="hover:text-primary-600">
          Home
        </Link>
        <span>/</span>
        <Link to="/browse" className="hover:text-primary-600">
          Browse
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.path} className="contents">
            <span>/</span>
            {index === breadcrumbs.length - 1 ? (
              <span className="text-black truncate max-w-xs">{crumb.name}</span>
            ) : (
              <Link
                to={`/browse?folder=${encodeURIComponent(crumb.path)}`}
                className="hover:text-primary-600 truncate max-w-xs"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* File metadata */}
      {currentDoc && (
        <>
          <Heading as="h1" size="xl" className="mb-4 w-full">
            {currentDoc.filename}
          </Heading>

          {/* AI Summary */}
          <Card variant="bordered" padding="md" className="mb-6 bg-blue-50">
            <Text size="sm" weight="medium" className="text-blue-900 mb-2">
              Document Summary
            </Text>
            <Text size="sm" className="text-blue-800">
              {currentDoc.summary}
            </Text>
          </Card>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Document type */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-lg text-sm font-medium">
                {currentDoc.type}
              </span>
              <span
                className={`px-2 py-0.5 text-xs rounded ${getConfidenceBadgeColor(
                  currentDoc.typeConfidence
                )}`}
              >
                {currentDoc.typeConfidence} confidence
              </span>
            </div>

            {/* Date */}
            {currentDoc.date && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-secondary-100 text-secondary-800 rounded-lg text-sm font-medium">
                  {formatDate(currentDoc.date)}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded ${getConfidenceBadgeColor(
                    currentDoc.dateConfidence
                  )}`}
                >
                  {currentDoc.dateConfidence} confidence
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {currentDoc.tags.length > 0 && (
            <div className="mb-6">
              <Text size="sm" weight="medium" className="mb-2 text-gray-700">
                Topics & Themes
              </Text>
              <div className="flex flex-wrap gap-2">
                {currentDoc.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/browse?tag=${encodeURIComponent(tag)}`}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${getTagColor(
                      tag
                    )}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mb-6 max-w-5xl mx-auto">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <div className="flex gap-2">
          {navigation.prev && (
            <Link to={`/viewer/${encodeURIComponent(navigation.prev.path)}`}>
              <Button variant="secondary">← Previous</Button>
            </Link>
          )}
          {navigation.next && (
            <Link to={`/viewer/${encodeURIComponent(navigation.next.path)}`}>
              <Button variant="secondary">Next →</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Content area */}
      {loading && (
        <Card
          variant="default"
          padding="lg"
          className="text-center bg-secondary-50"
        >
          <Text size="lg" color="muted">
            Loading document...
          </Text>
        </Card>
      )}

      {error && (
        <Card variant="default" padding="lg" className="text-center bg-red-50">
          <Text size="lg" className="text-red-700">
            Error loading file: {error}
          </Text>
        </Card>
      )}

      {!loading && !error && content && (
        <Card variant="default" padding="lg" className="max-w-5xl mx-auto">
          <div className="font-mono text-sm text-black leading-relaxed">
            {processedContent.split('\n\n').map((paragraph, index) => {
              // Convert remaining single newlines to <br> for HTML rendering
              const htmlParagraph = paragraph.replace(/\n/g, '<br />');
              return (
                <p
                  key={index}
                  className="mb-4 last:mb-0"
                  dangerouslySetInnerHTML={{ __html: htmlParagraph }}
                />
              );
            })}
          </div>
        </Card>
      )}

      {/* Related documents */}
      {!loading && !error && relatedDocs.length > 0 && (
        <div className="mt-8 max-w-5xl mx-auto">
          <Heading as="h2" size="md" className="mb-4">
            Related Documents
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedDocs.map((doc) => (
              <Link
                key={doc.path}
                to={`/viewer/${encodeURIComponent(doc.path)}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-primary-300 transition-all"
              >
                <h3 className="font-medium text-primary-700 mb-2 truncate">
                  {doc.filename}
                </h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {doc.summary}
                </p>
                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(
                        tag
                      )}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{doc.tags.length - 3}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      {!loading && !error && (
        <div className="flex justify-between mt-6 max-w-5xl mx-auto">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <div className="flex gap-2">
            {navigation.prev && (
              <Link to={`/viewer/${encodeURIComponent(navigation.prev.path)}`}>
                <Button variant="secondary">← Previous</Button>
              </Link>
            )}
            {navigation.next && (
              <Link to={`/viewer/${encodeURIComponent(navigation.next.path)}`}>
                <Button variant="secondary">Next →</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Viewer;
