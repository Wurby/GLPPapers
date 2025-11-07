import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArchive, useDatedDocuments } from '../hooks/useArchive';
import type { FlatDocument } from '../types/archive';
import { Card, Heading, Text } from '../components/ui';
import { formatDate } from '../utils/manifestUtils';

function Timeline() {
  const { documents, loading, error } = useArchive();
  const datedDocuments = useDatedDocuments(documents);

  // Group documents by year
  const documentsByYear = useMemo(() => {
    const grouped: Record<number, FlatDocument[]> = {};
    datedDocuments.forEach((doc) => {
      if (doc.year) {
        if (!grouped[doc.year]) {
          grouped[doc.year] = [];
        }
        grouped[doc.year].push(doc);
      }
    });
    return grouped;
  }, [datedDocuments]);

  // Get all years and sort them
  const years = useMemo(() => {
    return Object.keys(documentsByYear)
      .map(Number)
      .sort((a, b) => b - a); // Most recent first
  }, [documentsByYear]);

  const getYearDocuments = (year: number): FlatDocument[] => {
    return documentsByYear[year] || [];
  };

  const getTypeCount = (docs: FlatDocument[], typePattern: string): number => {
    return docs.filter((d) => d.type.toLowerCase().includes(typePattern)).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Heading as="h1" size="xl" className="mb-4">
        Timeline
      </Heading>
      <Text color="muted" className="mb-8">
        Explore Glenn L. Pearson's writings chronologically
      </Text>
      <Text size="sm" color="muted" className="mb-12">
        Showing {datedDocuments.length} documents with extracted dates (
        {((datedDocuments.length / documents.length) * 100).toFixed(0)}% of
        archive)
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

      {!loading && !error && years.length > 0 && (
        <div className="space-y-8">
          {years.map((year) => {
            const yearDocs = getYearDocuments(year);
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {yearDocs.map((doc) => (
                    <Link
                      key={doc.path}
                      to={`/viewer/${encodeURIComponent(doc.path)}`}
                      className="block bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-primary-300 transition-all"
                    >
                      <div className="text-sm font-medium text-primary-700 mb-1 truncate" title={doc.filename}>
                        {doc.filename}
                      </div>
                      {doc.date && (
                        <div className="text-xs text-gray-500 mb-1">
                          {formatDate(doc.date)}
                        </div>
                      )}
                      <div className="text-xs text-gray-600">
                        {doc.type}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Timeline;
