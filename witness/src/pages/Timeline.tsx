import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useArchive, groupFilesByYear } from '../hooks/useArchive';
import type { ArchiveFile } from '../types/archive';
import { Card, Heading, Text } from '../components/ui';

function Timeline() {
  const years: number[] = Array.from({ length: 11 }, (_, i) => 1982 + i); // 1982-1992
  const { manifest, loading, error } = useArchive();

  const filesByYear = useMemo(() => {
    if (!manifest) return null;
    return groupFilesByYear(manifest.files);
  }, [manifest]);

  const getYearFiles = (year: number): ArchiveFile[] => {
    if (!filesByYear) return [];
    return filesByYear[year] || [];
  };

  const getTypeCount = (files: ArchiveFile[], type: string): number => {
    return files.filter((f) => f.content_type === type).length;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Heading as="h1" size="xl" className="mb-4">
        Timeline
      </Heading>
      <Text color="muted" className="mb-12">
        Explore Glenn L. Pearson's writings chronologically from 1982 to 1992
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
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary-200" />

          {/* Timeline items */}
          <div className="space-y-12">
            {years.map((year) => {
              const yearFiles = getYearFiles(year);
              const journalCount = getTypeCount(yearFiles, 'journal');
              const letterCount = getTypeCount(yearFiles, 'letter');
              const bookCount = getTypeCount(yearFiles, 'book');
              const cesCount = getTypeCount(yearFiles, 'ces');

              return (
                <div key={year} className="relative pl-20">
                  {/* Year marker */}
                  <div
                    className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                      yearFiles.length > 0
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {year}
                  </div>

                  {/* Content card */}
                  <Card variant="hoverable" padding="md">
                    <Heading as="h3" size="sm" className="mb-3 w-full">
                      {year}
                    </Heading>

                    {yearFiles.length === 0 ? (
                      <Text color="muted" className="mb-4">
                        No archived content from {year}
                      </Text>
                    ) : (
                      <>
                        <Text color="muted" className="mb-4">
                          {yearFiles.length}{' '}
                          {yearFiles.length === 1 ? 'file' : 'files'} from{' '}
                          {year}
                        </Text>

                        {/* Content type badges */}
                        <div className="flex gap-2 flex-wrap mb-4 w-full">
                          {journalCount > 0 && (
                            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                              Journals ({journalCount})
                            </span>
                          )}
                          {letterCount > 0 && (
                            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                              Letters ({letterCount})
                            </span>
                          )}
                          {bookCount > 0 && (
                            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                              Books ({bookCount})
                            </span>
                          )}
                          {cesCount > 0 && (
                            <span className="px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full text-sm">
                              CES ({cesCount})
                            </span>
                          )}
                        </div>

                        {/* File list */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-4">
                          {yearFiles.map((file, index) => (
                            <Link
                              key={file.path}
                              to={`/viewer/${encodeURIComponent(file.path)}`}
                              className={`block text-sm text-primary-600 hover:text-primary-700 hover:underline ${index % 2 === 0 ? 'bg-primary-50' : ''}`}
                            >
                              {file.filename}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Timeline;
