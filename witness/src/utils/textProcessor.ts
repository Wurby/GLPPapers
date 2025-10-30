/**
 * Text Processing Utilities
 *
 * Functions for cleaning and formatting text files extracted from
 * Commodore 64 disk images that contain EasyScript word processor codes.
 */

export interface ProcessTextOptions {
  stripHeaders?: boolean;
  wrapLines?: boolean;
  maxLineLength?: number;
  decodeChars?: boolean;
}

export interface ExtractedMetadata {
  hasDate: boolean;
  dates: string[];
  possibleRecipients: string[];
}

/**
 * Remove EasyScript formatting header codes
 * These are lines that start with ';' or '*' containing formatting directives
 */
export function stripFormattingCodes(text: string): string {
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let headerEnded = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip header lines that start with ; or *
    if (!headerEnded && (trimmed.startsWith(';') || trimmed.startsWith('*'))) {
      continue;
    }

    // Once we hit a non-formatting line, we're past the header
    if (
      !headerEnded &&
      trimmed.length > 0 &&
      !trimmed.startsWith(';') &&
      !trimmed.startsWith('*')
    ) {
      headerEnded = true;
    }

    // Include all lines after header
    if (headerEnded) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n').trim();
}

/**
 * Add line breaks to very long lines for better web display
 * Original files have very long lines (paragraphs not wrapped)
 */
export function wrapLongLines(text: string, maxLength: number = 80): string {
  const lines = text.split('\n');
  const wrappedLines = [];

  for (const line of lines) {
    if (line.length <= maxLength) {
      wrappedLines.push(line);
      continue;
    }

    // For long lines, try to break at word boundaries
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      wrappedLines.push(currentLine);
    }
  }

  return wrappedLines.join('\n');
}

/**
 * Decode special character codes used for formatting
 * EasyScript used codes like `43` and `45` for bold/emphasis
 * Note: This is a placeholder - actual decoding may vary by document
 */
export function decodeSpecialCharacters(text: string): string {
  // Replace common character codes
  // These are approximations - actual codes may vary
  let decoded = text;

  // Remove character codes that appear to be formatting markers
  decoded = decoded.replace(/`\d+/g, ''); // Remove backtick-number codes

  return decoded;
}

/**
 * Full text processing pipeline
 * Applies all cleaning and formatting operations
 */
export function processText(
  rawText: string,
  options: ProcessTextOptions = {}
): string {
  const {
    stripHeaders = true,
    wrapLines = false,
    maxLineLength = 80,
    decodeChars = false,
  } = options;

  let processed = rawText;

  if (stripHeaders) {
    processed = stripFormattingCodes(processed);
  }

  if (decodeChars) {
    processed = decodeSpecialCharacters(processed);
  }

  if (wrapLines) {
    processed = wrapLongLines(processed, maxLineLength);
  }

  return processed;
}

/**
 * Extract potential metadata from text content
 * Looks for dates, recipients, etc. in the text
 */
export function extractMetadata(text: string): ExtractedMetadata {
  const metadata: ExtractedMetadata = {
    hasDate: false,
    dates: [],
    possibleRecipients: [],
  };

  // Look for date patterns in the text
  const datePatterns = [
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/gi,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/gi,
    /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g,
  ];

  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      metadata.hasDate = true;
      metadata.dates.push(...matches);
    }
  }

  // Look for letter salutations (Dear X,)
  const salutationMatch = text.match(/Dear\s+([^,]+),/i);
  if (salutationMatch) {
    metadata.possibleRecipients.push(salutationMatch[1].trim());
  }

  return metadata;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  // If it's just a year
  if (/^\d{4}$/.test(dateString)) {
    return dateString;
  }

  // If it's a full ISO date
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
