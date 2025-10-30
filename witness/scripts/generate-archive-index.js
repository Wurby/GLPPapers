#!/usr/bin/env node

/**
 * Generate Archive Index
 *
 * Scans the Box 3 archive directory and creates a JSON index file
 * with metadata for all text files to enable browsing and search.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARCHIVE_DIR = path.join(__dirname, '../public/archive/box-3');
const OUTPUT_FILE = path.join(__dirname, '../public/archive/manifest.json');

/**
 * Parse year from filename
 * Handles formats like: 2jan1989.txt, 122385.txt (MMDDYY), 1988xmasltr.txt
 * Returns just the year as a number
 */
function parseYear(filename) {
  // Try MMDDYY format (e.g., 122385 = December 23, 1985)
  const mmddyyMatch = filename.match(/(\d{6})/);
  if (mmddyyMatch) {
    const dateStr = mmddyyMatch[1];
    let year = parseInt(dateStr.substring(4, 6), 10);
    // Convert 2-digit year to 4-digit (assuming 1900s for 82-99, 2000s for 00-09)
    year = year >= 82 ? 1900 + year : 2000 + year;
    return year;
  }

  // Try format like "2jan1989" or "5apr90"
  const monthDayYearMatch = filename.match(
    /(\d{1,2})(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(\d{2,4})/i
  );
  if (monthDayYearMatch) {
    let year = parseInt(monthDayYearMatch[3], 10);
    // Convert 2-digit year to 4-digit
    if (year < 100) {
      year = year >= 82 ? 1900 + year : 2000 + year;
    }
    return year;
  }

  // Try to extract just a year (e.g., 1988xmasltr)
  const yearMatch = filename.match(/(19\d{2}|20\d{2})/);
  if (yearMatch) {
    return parseInt(yearMatch[1], 10);
  }

  return null;
}

/**
 * Determine content type from category name and filename
 */
function determineContentType(category, filename, subdirectory) {
  const lower = filename.toLowerCase();
  const categoryLower = category.toLowerCase();

  // Check category first
  if (categoryLower.includes('journal')) {
    return 'journal';
  }
  if (categoryLower.includes('ltr') || categoryLower.includes('letter')) {
    // Could be either journal or letter - check filename
    if (lower.includes('ltr') || lower.includes('letter')) {
      return 'letter';
    }
    return 'journal'; // Default to journal in JOURNAL + LTR FILES
  }
  if (categoryLower.includes('ces')) {
    return 'ces';
  }
  if (
    categoryLower.includes('book') ||
    categoryLower.includes('building faith')
  ) {
    return 'book';
  }
  if (categoryLower.includes('draft')) {
    return 'book';
  }

  // Check filename patterns
  if (
    lower.includes('letter') ||
    lower.includes('ltr') ||
    /^(allan|betty|chad|curtis|gordon|henry|dal)/.test(lower)
  ) {
    return 'letter';
  }
  if (lower.includes('journal')) {
    return 'journal';
  }

  return 'unknown';
}

/**
 * Recursively scan directory and collect file information
 */
function scanDirectory(dirPath, baseDir = dirPath) {
  const files = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Recursively scan subdirectories
      files.push(...scanDirectory(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.txt')) {
      // Extract file metadata
      const stats = fs.statSync(fullPath);
      const pathParts = relativePath.split(path.sep);

      // Category is the top-level directory
      const category = pathParts[0];

      // Subdirectory is everything between category and filename
      const subdirectory =
        pathParts.length > 2 ? pathParts.slice(1, -1).join('/') : null;

      const relativePathNormalized = relativePath.replace(/\\/g, '/'); // Normalize to forward slashes
      const year = parseYear(entry.name);
      const contentType = determineContentType(
        category,
        entry.name,
        subdirectory
      );

      files.push({
        filename: entry.name,
        path: `box-3/${relativePathNormalized}`, // Path relative to /archive/
        content_type: contentType,
        year: year,
        size: stats.size,
        original_path: relativePathNormalized, // Original path within box-3
      });
    }
  }

  return files;
}

/**
 * Main execution
 */
function generateIndex() {
  console.log('Scanning archive directory:', ARCHIVE_DIR);

  if (!fs.existsSync(ARCHIVE_DIR)) {
    console.error('Error: Archive directory does not exist:', ARCHIVE_DIR);
    process.exit(1);
  }

  const files = scanDirectory(ARCHIVE_DIR);

  // Calculate stats by type
  const statsByType = files.reduce((acc, file) => {
    acc[file.content_type] = (acc[file.content_type] || 0) + 1;
    return acc;
  }, {});

  // Calculate stats by year
  const statsByYear = files.reduce((acc, file) => {
    if (file.year) {
      acc[file.year] = (acc[file.year] || 0) + 1;
    }
    return acc;
  }, {});

  // Create manifest object matching the ArchiveManifest type
  const manifest = {
    generated_at: new Date().toISOString(),
    total_files: files.length,
    stats: {
      by_type: statsByType,
      by_year: statsByYear,
    },
    files: files.sort((a, b) => {
      // Sort by year (descending), then by filename
      if (a.year && b.year && a.year !== b.year) {
        return b.year - a.year; // Most recent first
      }
      if (a.year && !b.year) return -1;
      if (!a.year && b.year) return 1;
      return a.filename.localeCompare(b.filename);
    }),
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`\nManifest generated successfully!`);
  console.log(`Total files: ${manifest.total_files}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`\nBy Content Type:`);
  Object.entries(statsByType).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count} files`);
  });
  console.log(`\nBy Year (top 10):`);
  Object.entries(statsByYear)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([year, count]) => {
      console.log(`  - ${year}: ${count} files`);
    });
}

// Run the script
generateIndex();
