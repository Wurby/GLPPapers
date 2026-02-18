import { useMemo } from 'react';
import { useArchiveData as useArchive } from '../hooks/useArchiveData';
import type { FlatDocument } from '../types/archive';
import { Card, Heading, Text } from '../components/ui';
import { DocumentPreviewLink } from '../components/DocumentPreview';

function Timeline() {
  const { documents, loading, error } = useArchive();

  // Separate dated and undated documents
  const { documentsByYear, undatedDocuments, years } = useMemo(() => {
    const grouped: Record<number, FlatDocument[]> = {};
    const undated: FlatDocument[] = [];

    documents.forEach((doc) => {
      if (doc.year) {
        if (!grouped[doc.year]) {
          grouped[doc.year] = [];
        }
        grouped[doc.year].push(doc);
      } else {
        undated.push(doc);
      }
    });

    const sortedYears = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a); // Most recent first

    return {
      documentsByYear: grouped,
      undatedDocuments: undated,
      years: sortedYears,
    };
  }, [documents]);

  const getTypeCount = (docs: FlatDocument[], typePattern: string): number => {
    return docs.filter((d) => d.type.toLowerCase().includes(typePattern)).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Heading as="h1" size="xl" className="mb-4">
        Timeline
      </Heading>
      <Text color="muted" className="mb-4">
        Explore Glenn L. Pearson's writings chronologically
      </Text>
      <Text size="sm" color="muted" className="mb-12">
        Showing all {documents.length} documents •{' '}
        {documents.length - undatedDocuments.length} with dates •{' '}
        {undatedDocuments.length} undated
      </Text>

      {loading && (
        <Card
          variant="default"
          padding="lg"
          className="text-center bg-secondary-50"
        >
          <Text size="lg" color="muted">
            Loading timeline...
          </Text>
        </Card>
      )}

      {error && (
        <Card variant="default" padding="lg" className="text-center bg-red-50">
          <Text size="lg" className="text-red-700">
            Error loading timeline: {error}
          </Text>
        </Card>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Dated documents grouped by year */}
          {years.map((year) => {
            const yearDocs = documentsByYear[year] || [];
            const journalCount = getTypeCount(yearDocs, 'journal');
            const letterCount = getTypeCount(yearDocs, 'letter');
            const bookCount = getTypeCount(yearDocs, 'book');
            const cesCount = getTypeCount(yearDocs, 'ces');

            return (
              <div key={year} className="mb-12">
                {/* Year header */}
                <div className="flex items-baseline gap-4 mb-4 border-b-2 border-primary-300 pb-2">
                  <Heading as="h2" size="lg" className="text-primary-700">
                    {year}
                  </Heading>
                  <Text color="muted" size="sm">
                    {yearDocs.length}{' '}
                    {yearDocs.length === 1 ? 'document' : 'documents'}
                  </Text>

                  {/* Content type badges */}
                  <div className="flex gap-2 flex-wrap ml-auto">
                    {journalCount > 0 && (
                      <span className="px-2 py-0.5 bg-secondary-200 text-secondary-800 rounded text-xs">
                        Journals ({journalCount})
                      </span>
                    )}
                    {letterCount > 0 && (
                      <span className="px-2 py-0.5 bg-secondary-200 text-secondary-800 rounded text-xs">
                        Letters ({letterCount})
                      </span>
                    )}
                    {bookCount > 0 && (
                      <span className="px-2 py-0.5 bg-secondary-200 text-secondary-800 rounded text-xs">
                        Books ({bookCount})
                      </span>
                    )}
                    {cesCount > 0 && (
                      <span className="px-2 py-0.5 bg-secondary-200 text-secondary-800 rounded text-xs">
                        CES ({cesCount})
                      </span>
                    )}
                  </div>
                </div>

                {/* Document grid */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                  {yearDocs.map((doc) => (
                    <DocumentPreviewLink
                      key={doc.path}
                      doc={doc}
                      className="block bg-white border border-gray-200 rounded px-2 py-1.5 hover:shadow-md hover:border-primary-300 transition-all"
                    >
                      <div className="text-xs font-medium text-primary-700 truncate" title={doc.filename}>
                        {doc.filename}
                      </div>
                    </DocumentPreviewLink>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Undated documents */}
          {undatedDocuments.length > 0 && (
            <div className="mb-12">
              <div className="flex items-baseline gap-4 mb-4 border-b-2 border-gray-300 pb-2">
                <Heading as="h2" size="lg" className="text-gray-700">
                  Undated Documents
                </Heading>
                <Text color="muted" size="sm">
                  {undatedDocuments.length}{' '}
                  {undatedDocuments.length === 1 ? 'document' : 'documents'}
                </Text>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
                {undatedDocuments.map((doc) => (
                  <DocumentPreviewLink
                    key={doc.path}
                    doc={doc}
                    className="block bg-white border border-gray-200 rounded px-2 py-1.5 hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    <div className="text-xs font-medium text-gray-700 truncate" title={doc.filename}>
                      {doc.filename}
                    </div>
                  </DocumentPreviewLink>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Timeline;
