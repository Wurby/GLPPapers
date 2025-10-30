import { useState } from 'react';
import { Button, Card, Input, Heading, Text, Link } from '../components/ui';

/**
 * Component Demo Page
 *
 * Demonstrates all custom UI components with Apple liquid glass design.
 * This page can be used for testing and as a living style guide.
 */

export default function ComponentDemo() {
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="min-h-screen py-12 px-4 bg-secondary-50">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <Heading as="h1" size="2xl">
            UI Component Library
          </Heading>
          <Text size="lg" color="muted" className="mt-4">
            Simplified Design System
          </Text>
        </div>

        {/* Buttons */}
        <Card variant="default" padding="lg">
          <Heading as="h2" size="lg" className="mb-6">
            Button Components
          </Heading>

          <div className="space-y-6">
            {/* Primary Buttons - Outline that fills */}
            <div>
              <Text weight="semibold" className="mb-3">
                Primary (Outline → Fill on hover)
              </Text>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div>
              <Text weight="semibold" className="mb-3">
                Secondary (Outline → Fill on hover)
              </Text>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Loading Button */}
            <div>
              <Text weight="semibold" className="mb-3">
                Loading State
              </Text>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" isLoading>
                  Loading...
                </Button>
                <Button variant="secondary" isLoading>
                  Processing
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards */}
        <Card variant="default" padding="lg">
          <Heading as="h2" size="lg" className="mb-6">
            Card Components
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card variant="default" padding="md">
              <Heading as="h3" size="sm">
                Default Card
              </Heading>
              <Text size="sm" className="mt-2">
                Clean card with subtle shadow and border.
              </Text>
            </Card>

            <Card variant="bordered" padding="md">
              <Heading as="h3" size="sm">
                Bordered Card
              </Heading>
              <Text size="sm" className="mt-2">
                Card with left accent border for emphasis.
              </Text>
            </Card>

            <Card variant="hoverable" padding="md">
              <Heading as="h3" size="sm">
                Hoverable Card
              </Heading>
              <Text size="sm" className="mt-2">
                Interactive card with hover effects. Try hovering!
              </Text>
            </Card>
          </div>
        </Card>

        {/* Inputs */}
        <Card variant="default" padding="lg">
          <Heading as="h2" size="lg" className="mb-6">
            Input Components
          </Heading>

          <div className="space-y-6 max-w-xl">
            <Input
              type="text"
              label="Text Input"
              placeholder="Enter some text..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="This is helper text for the input field."
            />

            <Input
              type="search"
              placeholder="Search the archive..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
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

            <Input
              type="email"
              label="Email Input"
              placeholder="your.email@example.com"
              error="Please enter a valid email address"
            />

            <Input
              type="text"
              label="Disabled Input"
              placeholder="This field is disabled"
              disabled
            />
          </div>
        </Card>

        {/* Typography */}
        <Card variant="default" padding="lg">
          <Heading as="h2" size="lg" className="mb-6">
            Typography Components
          </Heading>

          <div className="space-y-8">
            {/* Headings */}
            <div>
              <Text weight="semibold" className="mb-4">
                Headings
              </Text>
              <div className="space-y-2">
                <Heading as="h1">Heading 1 - Extra Large</Heading>
                <Heading as="h2">Heading 2 - Large</Heading>
                <Heading as="h3">Heading 3 - Medium</Heading>
                <Heading as="h4">Heading 4 - Small</Heading>
                <Heading as="h5">Heading 5 - Extra Small</Heading>
                <Heading as="h6">Heading 6 - Extra Small</Heading>
              </div>
            </div>

            {/* Text Variants */}
            <div>
              <Text weight="semibold" className="mb-4">
                Text Variants
              </Text>
              <div className="space-y-2">
                <Text size="xs">Extra small text (xs)</Text>
                <Text size="sm">Small text (sm)</Text>
                <Text size="base">Base text (default)</Text>
                <Text size="lg">Large text (lg)</Text>
                <Text size="xl">Extra large text (xl)</Text>
              </div>

              <div className="mt-4 space-y-2">
                <Text color="default">Default color text</Text>
                <Text color="muted">Muted color text</Text>
                <Text color="primary">Primary color text</Text>
              </div>
            </div>

            {/* Links */}
            <div>
              <Text weight="semibold" className="mb-4">
                Link Variants
              </Text>
              <div className="space-y-3">
                <div>
                  <Link href="#" variant="default">
                    Default link with underline
                  </Link>
                </div>
                <div>
                  <Link href="#" variant="subtle">
                    Subtle link (hover for underline)
                  </Link>
                </div>
                <div>
                  <Link href="https://example.com" external variant="default">
                    External link
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Integration Example */}
        <Card variant="bordered" padding="lg">
          <Heading as="h2" size="lg" className="mb-4">
            Integration Example
          </Heading>
          <Text className="mb-6">
            This demonstrates how components work together in a real-world
            scenario.
          </Text>

          <div className="space-y-4">
            <Input
              type="search"
              placeholder="Search for documents..."
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="hoverable" padding="md">
                <Heading as="h3" size="xs" className="mb-2">
                  Journals
                </Heading>
                <Text size="sm" color="muted" className="mb-4">
                  Personal reflections and daily entries from 1982-1992.
                </Text>
                <Button variant="primary">Browse Journals</Button>
              </Card>

              <Card variant="hoverable" padding="md">
                <Heading as="h3" size="xs" className="mb-2">
                  Letters
                </Heading>
                <Text size="sm" color="muted" className="mb-4">
                  Correspondence with family, friends, and colleagues.
                </Text>
                <Button variant="primary">Browse Letters</Button>
              </Card>

              <Card variant="hoverable" padding="md">
                <Heading as="h3" size="xs" className="mb-2">
                  Published Works
                </Heading>
                <Text size="sm" color="muted" className="mb-4">
                  Articles, talks, and manuscripts for publication.
                </Text>
                <Button variant="primary">View Works</Button>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
