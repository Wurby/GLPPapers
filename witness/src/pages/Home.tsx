import { Link as RouterLink } from 'react-router-dom';
import { useRandomLogo } from '../utils/logoUtils';
import { useArchiveData as useArchive } from '../hooks/useArchiveData';
import { Card, Heading, Text } from '../components/ui';
import { getTagColor } from '../utils/manifestUtils';

function Home() {
  const currentLogo = useRandomLogo();
  const { stats, topTags } = useArchive();

  // Get counts for specific document types
  const getTypeCount = (typePattern: string) => {
    if (!stats) return 0;
    return Object.entries(stats.documentTypes)
      .filter(([type]) => type.toLowerCase().includes(typePattern))
      .reduce((sum, [, count]) => sum + count, 0);
  };

  const journalCount = getTypeCount('journal');
  const letterCount = getTypeCount('letter');
  const cesCount = getTypeCount('ces');
  const totalFiles = stats?.totalDocuments || 0;
  const dateCoverage = stats?.dateRange.coverage_percentage || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-8">
          <img
            src={currentLogo}
            alt="Glenn L. Pearson Papers"
            className="h-64 w-auto"
          />
        </div>
        <Text size="lg" className="mb-2">
          Professor • Author • Father • Grandfather • Servant of God
        </Text>
        <Text size="base" color="muted" className="mb-8">
          Preserving the journals, letters, and writings from a life of faith
          and learning.
        </Text>
        {totalFiles > 0 && (
          <Text color="primary" weight="semibold">
            {totalFiles} digitally preserved files now available
          </Text>
        )}
      </div>

      <Card variant="bordered" padding="md" className="mb-12">
        <Text size="lg" weight="medium" className="italic mb-2">
          "I, GLENN L. PEARSON, BEING OF FAIRLY SOUND MIND AND REASONABLY GOOD
          CHARACTER..."
        </Text>
        <Text size="sm" color="muted" className="w-full">
          — From his 1992 New Year's Resolutions
        </Text>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card
          variant="hoverable"
          padding="md"
          cardActions={
            <RouterLink
              to="/browse"
              className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 hover:decoration-primary-500 focus:text-primary-800 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
            >
              Explore journals →
            </RouterLink>
          }
        >
          <Heading as="h2" size="sm" className="mb-3">
            Personal Journals
            {journalCount > 0 && (
              <span className="text-sm font-normal text-black/60 ml-2">
                ({journalCount})
              </span>
            )}
          </Heading>
          <Text color="muted" className="mb-4">
            Daily reflections, travels, and personal testimony.
          </Text>
        </Card>

        <Card
          variant="hoverable"
          padding="md"
          cardActions={
            <RouterLink
              to="/browse"
              className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 hover:decoration-primary-500 focus:text-primary-800 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
            >
              View letters →
            </RouterLink>
          }
        >
          <Heading as="h2" size="sm" className="mb-3">
            Letters & Correspondence
            {letterCount > 0 && (
              <span className="text-sm font-normal text-black/60 ml-2">
                ({letterCount})
              </span>
            )}
          </Heading>
          <Text color="muted" className="mb-4">
            Personal letters to family, friends, and colleagues over the years.
          </Text>
        </Card>

        <Card
          variant="hoverable"
          padding="md"
          cardActions={
            <RouterLink
              to="/browse"
              className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 hover:decoration-primary-500 focus:text-primary-800 transition-all font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
            >
              View essays →
            </RouterLink>
          }
        >
          <Heading as="h2" size="sm" className="mb-3">
            CES Essays.
            {cesCount > 0 && (
              <span className="text-sm font-normal text-black/60 ml-2">
                ({cesCount})
              </span>
            )}
          </Heading>
          <Text color="muted" className="mb-4">
            Writings and essays prepared for the Church Educational System
            including a series of essays on the Book of Mormon prepared at the
            request of President Ezra Taft Benson.
          </Text>
        </Card>
      </div>

      {/* Archive Statistics */}
      {stats && (
        <Card variant="bordered" padding="md" className="mb-12">
          <Heading as="h3" size="sm" className="mb-4 w-full">
            Archive Statistics
          </Heading>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-3xl font-bold text-primary-700">
                {stats.totalDocuments.toLocaleString()}
              </div>
              <Text size="sm" color="muted">
                Total Documents
              </Text>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-700">
                {stats.totalFolders}
              </div>
              <Text size="sm" color="muted">
                Collections
              </Text>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-700">
                {dateCoverage.toFixed(2)}%
              </div>
              <Text size="sm" color="muted">
                Dated Documents
              </Text>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-700">
                {Object.keys(stats.documentTypes).length}
              </div>
              <Text size="sm" color="muted">
                Document Types
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* Tag Cloud */}
      {topTags.length > 0 && (
        <Card variant="bordered" padding="md" className="mb-12">
          <Heading as="h3" size="sm" className="mb-4">
            Explore by Topic
          </Heading>
          <Text size="sm" color="muted" className="mb-4">
            Browse documents by subject matter and themes
          </Text>
          <div className="flex flex-wrap gap-2">
            {topTags.slice(0, 30).map(({ tag, count }) => (
              <RouterLink
                key={tag}
                to={`/browse?tag=${encodeURIComponent(tag)}`}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${getTagColor(
                  tag
                )}`}
              >
                {tag}
                <span className="ml-1.5 opacity-60">({count})</span>
              </RouterLink>
            ))}
          </div>
          <div className="mt-4">
            <RouterLink
              to="/browse"
              className="text-primary-600 underline decoration-primary-300 hover:text-primary-700 hover:decoration-primary-500 text-sm font-medium"
            >
              View all documents →
            </RouterLink>
          </div>
        </Card>
      )}

      <Card variant="default" padding="lg" className="bg-primary-50">
        <Heading as="h2" size="md" className="mb-4">
          About This Digital Archive
        </Heading>
        <Text className="mb-4">
          This archive preserves Glenn L. Pearson's digital writings from the
          early home computing era. All documents were originally created on a
          Commodore 64 computer and saved to floppy disks between 1982 and 1992.
        </Text>
        <Text>
          Through careful digital preservation, these files have been recovered
          and made accessible for family members and researchers interested in
          his work and testimony.
        </Text>
      </Card>
    </div>
  );
}

export default Home;
