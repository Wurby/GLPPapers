import glennArdith from '../assets/glenn-ardith.jpg';
import { Card, Heading, Text } from '../components/ui';

function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="w-full flex flex-col items-center">
          <img
            src={glennArdith}
            alt="Glenn L. Pearson with his wife Ardith"
            className="h-128 w-auto mx-auto mb-6 rounded-3xl shadow-md shadow-primary-900"
          />
          <Text size="xs" color="muted" className="italic mb-4">
            Glenn L. Pearson with his wife Ardith, circa 1990s
          </Text>
        </div>
        <Heading as="h1" size="xl">
          About Glenn L. Pearson
        </Heading>
      </div>

      <div className="prose prose-lg max-w-none">
        <Card variant="default" padding="lg" className="mb-8">
          <Heading as="h2" size="md" className="mb-4">
            Life & Ministry
          </Heading>
          <Text className="mb-4">
            Glenn L. Pearson was a devoted religion professor at BYU, author of
            several books under his own name and as a ghost writer, and member
            of The Church of Jesus Christ of Latter-day Saints. His writings
            include "The Book of Mormon: Key to Conversion" and extensive
            journals documenting his life, travels, and testimony.
          </Text>
          <Text className="mb-4">
            Throughout his career, he served in the Church Educational System
            (CES), teaching and inspiring students with his deep understanding
            of scripture and unwavering faith.
          </Text>
        </Card>

        <Card variant="default" padding="lg" className="mb-8">
          <Heading as="h2" size="md" className="mb-4">
            The Commodore 64 Era
          </Heading>
          <Text className="mb-4">
            This digital archive contains records, primarily sourced from the
            Commodore 64 era (1982-1992), including personal journals, letters,
            course materials for the Church Educational System (CES), and book
            manuscripts.
          </Text>
          <Text className="mb-4">
            As an early adopter of home computing technology, Glenn used his
            Commodore 64 to meticulously document his thoughts, experiences, and
            spiritual insights.
          </Text>
        </Card>

        <Card variant="default" padding="lg">
          <Heading as="h2" size="md" className="mb-4">
            Legacy
          </Heading>
          <Text className="mb-4">
            Known for his wit, deep faith, and dedication to family, Glenn L.
            Pearson left behind a rich legacy of written testimony and personal
            reflection that continues to inspire.
          </Text>
          <Text>
            His writings provide a unique window into the life of a faithful
            Latter-day Saint educator during a transformative period in both
            technology and Church history. Glenn passed away on April 2, 1999,
            but his legacy lives on through his extensive body of work.
          </Text>
        </Card>
      </div>
    </div>
  );
}

export default About;
