import { useParams, useNavigate, Link } from 'react-router-dom';
import { useArchiveFile, useArchive } from '../hooks/useArchive';
import { useMemo } from 'react';
import { processText } from '../utils/textProcessor';
import { Card, Heading, Text, Button } from '../components/ui';

function Viewer() {
  const { filePath } = useParams<{ filePath: string }>();
  const navigate = useNavigate();
  const decodedPath = filePath ? decodeURIComponent(filePath) : '';
  const { content, loading, error } = useArchiveFile(decodedPath);
  const { manifest } = useArchive();

  const currentFile = useMemo(() => {
    if (!manifest || !decodedPath) return null;
    return manifest.files.find((f) => f.path === decodedPath);
  }, [manifest, decodedPath]);

  const navigationFiles = useMemo(() => {
    if (!manifest || !currentFile) return { prev: null, next: null };

    const currentIndex = manifest.files.findIndex(
      (f) => f.path === currentFile.path
    );
    const prev = currentIndex > 0 ? manifest.files[currentIndex - 1] : null;
    const next =
      currentIndex < manifest.files.length - 1
        ? manifest.files[currentIndex + 1]
        : null;

    return { prev, next };
  }, [manifest, currentFile]);

  const processedContent = useMemo(() => {
    if (!content) return '';
    return processText(content, {
      stripHeaders: true,
      wrapLines: false, // Let browser handle wrapping with whitespace-pre-wrap
      decodeChars: true,
    });
  }, [content]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
      <nav className="mb-6 text-sm text-black/60">
        <Link to="/" className="hover:text-primary-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link to="/browse" className="hover:text-primary-600">
          Browse
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black">
          {currentFile?.filename || 'Loading...'}
        </span>
      </nav>

      {/* File metadata */}
      {currentFile && (
        <>
          <Heading as="h1" size="xl" className="mb-4 w-full">
            {currentFile.filename}
          </Heading>
          <div className="flex flex-wrap gap-4 text-sm text-black/70 pb-2 mb-6 border-b border-black/10">
            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full">
              {currentFile.content_type}
            </span>
            {currentFile.year && (
              <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full">
                {currentFile.year}
              </span>
            )}
            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full">
              {formatFileSize(currentFile.size)}
            </span>
          </div>
        </>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mb-6 max-w-5xl mx-auto">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <div className="flex gap-2">
          {navigationFiles.prev && (
            <Link
              to={`/viewer/${encodeURIComponent(navigationFiles.prev.path)}`}
            >
              <Button variant="secondary">← Previous</Button>
            </Link>
          )}
          {navigationFiles.next && (
            <Link
              to={`/viewer/${encodeURIComponent(navigationFiles.next.path)}`}
            >
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
            Loading file...
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
          <pre className="whitespace-pre-wrap font-mono text-sm text-black overflow-x-auto">
            {processedContent}
          </pre>
        </Card>
      )}

      {/* Bottom navigation */}
      {!loading && !error && (
        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <div className="flex gap-2">
            {navigationFiles.prev && (
              <Link
                to={`/viewer/${encodeURIComponent(navigationFiles.prev.path)}`}
              >
                <Button variant="secondary">← Previous</Button>
              </Link>
            )}
            {navigationFiles.next && (
              <Link
                to={`/viewer/${encodeURIComponent(navigationFiles.next.path)}`}
              >
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
