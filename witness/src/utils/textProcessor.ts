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
 * Preserves paragraph structure and blank lines
 */
export function stripFormattingCodes(text: string): string {
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let inContent = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip lines that are ONLY formatting codes (no text content)
    if (trimmed.length > 0 && (
        trimmed.startsWith(';') ||
        trimmed.match(/^\*[a-z]{1,4}\d+:.*$/) ||  // *lm12:rm75, etc.
        trimmed.match(/^\*\d+=.*$/) ||             // *0=14:1=20, etc.
        trimmed.match(/^\*ft\d+:.*$/) ||           // *ft4:..., etc.
        trimmed.match(/^\*vp\d+$/) ||              // *vp4
        trimmed.match(/^\*nb".*"$/)                // *nb"filename"
    )) {
      continue;
    }

    // Once we hit real content, start including lines
    if (!inContent && trimmed.length > 0) {
      inContent = true;
    }

    if (inContent) {
      // Preserve blank lines for paragraph structure
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
 * EasyScript formatting code mappings
 * Based on Commodore 64 EasyScript word processor conventions
 */
const EASYSCRIPT_CODES: Record<string, { type: string; tag?: string; class?: string }> = {
  // Text formatting
  '04': { type: 'bold-start', tag: 'strong' },
  '20': { type: 'bold-end', tag: 'strong' },
  '18': { type: 'underline-start', tag: 'u' },
  '146': { type: 'underline-end', tag: 'u' },
  '046': { type: 'emphasis-start', tag: 'em' },
  '147': { type: 'emphasis-end', tag: 'em' },
  '43': { type: 'quote-start', class: 'font-semibold' },
  '45': { type: 'quote-end', class: 'font-semibold' },

  // Other codes (ignore for now)
  '05': { type: 'color' },
  '28': { type: 'color' },
  '29': { type: 'color' },
  '30': { type: 'color' },
  '31': { type: 'color' },
};

/**
 * Translate EasyScript formatting codes to HTML/React markup
 * Preserves original formatting intent while making it web-readable
 */
export function translateEasyScriptFormatting(text: string): string {
  const openTags: string[] = [];

  // Find all 2-3 digit codes adjacent to letters
  const codePattern = /(\d{2,3})(?=[A-Za-z])|(?<=[A-Za-z])(\d{2,3})/g;
  const matches = [...text.matchAll(codePattern)];

  // Build a new string with HTML tags
  let processed = '';
  let lastIndex = 0;

  matches.forEach((match) => {
    const code = match[0];
    const index = match.index!;
    const mapping = EASYSCRIPT_CODES[code];

    // Add text before this code
    processed += text.substring(lastIndex, index);

    if (mapping && mapping.tag) {
      if (mapping.type.endsWith('-start')) {
        // Opening tag
        if (mapping.class) {
          processed += `<span class="${mapping.class}">`;
          openTags.push('span');
        } else {
          processed += `<${mapping.tag}>`;
          openTags.push(mapping.tag);
        }
      } else if (mapping.type.endsWith('-end')) {
        // Closing tag
        const tagToClose = openTags.pop();
        if (tagToClose) {
          processed += `</${tagToClose}>`;
        }
      }
    } else if (!mapping) {
      // Unknown code - just remove it
      // (already not added to processed)
    }

    lastIndex = index + code.length;
  });

  // Add remaining text
  processed += text.substring(lastIndex);

  // Close any unclosed tags
  while (openTags.length > 0) {
    const tag = openTags.pop();
    processed += `</${tag}>`;
  }

  return processed;
}

/**
 * Decode special character codes used for formatting
 * Now translates EasyScript codes to HTML instead of removing them
 */
export function decodeSpecialCharacters(text: string): string {
  let decoded = text;

  // Remove backtick-number codes (e.g., `43text`45)
  decoded = decoded.replace(/`\d+/g, '');

  // Translate EasyScript formatting codes to HTML
  decoded = translateEasyScriptFormatting(decoded);

  // Clean up any remaining control characters EXCEPT newlines
  decoded = decoded.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

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

  // Normalize line breaks - ensure paragraphs are separated by double newlines
  processed = processed
    .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
    .replace(/\n\n/g, '\n\n');    // Keep double newlines as-is

  return processed.trim();
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
