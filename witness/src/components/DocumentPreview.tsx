import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FlatDocument } from '../types/archive';
import { getTagColor, formatDate } from '../utils/manifestUtils';

interface DocumentPreviewProps {
  doc: FlatDocument;
  children: React.ReactNode;
  compact?: boolean;
}

/**
 * DocumentPreview component that shows a popover with document details on hover
 * Wraps any content (typically a link or card) and displays a preview overlay
 */
export function DocumentPreview({ doc, children, compact = false }: DocumentPreviewProps) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}

      {isHovering && (
        <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-white border-2 border-primary-300 rounded-lg shadow-xl p-4 pointer-events-none">
          {/* Title */}
          <h4 className="font-semibold text-primary-700 mb-2 break-words">
            {doc.filename}
          </h4>

          {/* Date and Type */}
          <div className="flex gap-2 items-center mb-3">
            <span className="px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded">
              {doc.type}
            </span>
            {doc.date && (
              <span className="text-xs text-gray-600">
                {formatDate(doc.date)}
              </span>
            )}
          </div>

          {/* Summary */}
          {!compact && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {doc.summary}
            </p>
          )}

          {/* Tags */}
          {doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {doc.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className={`px-2 py-0.5 text-xs rounded-full ${getTagColor(tag)}`}
                >
                  {tag}
                </span>
              ))}
              {doc.tags.length > 5 && (
                <span className="text-xs text-gray-500 px-2 py-0.5">
                  +{doc.tags.length - 5} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper component that combines DocumentPreview with a Link
 * For simple cases where you just need a preview on a link
 */
export function DocumentPreviewLink({
  doc,
  compact = false,
  className = "",
  children
}: {
  doc: FlatDocument;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DocumentPreview doc={doc} compact={compact}>
      <Link
        to={`/viewer/${encodeURIComponent(doc.path)}`}
        className={className}
      >
        {children}
      </Link>
    </DocumentPreview>
  );
}
