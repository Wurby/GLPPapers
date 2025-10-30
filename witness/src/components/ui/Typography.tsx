import React from 'react';

/**
 * Typography Components - Apple Liquid Glass Design
 *
 * Heading, Text, and Link components with consistent styling and optional glass effects.
 */

// ========== HEADING COMPONENT ==========

/**
 * Heading Component
 *
 * Semantic heading component with consistent styling.
 *
 * @example
 * ```tsx
 * <Heading as="h1" size="4xl">Page Title</Heading>
 * <Heading as="h2" size="2xl" gradient>Section Title</Heading>
 * ```
 */

export interface HeadingProps {
  /**
   * Semantic heading level
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  /**
   * Visual size (can differ from semantic level)
   * - xs: text-xl
   * - sm: text-2xl
   * - md: text-3xl
   * - lg: text-4xl
   * - xl: text-5xl
   * - 2xl: text-6xl
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Heading content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

const headingSizeStyles = {
  xs: 'text-xl',
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
  '2xl': 'text-6xl',
};

const headingDefaultSizes = {
  h1: 'xl',
  h2: 'lg',
  h3: 'md',
  h4: 'sm',
  h5: 'xs',
  h6: 'xs',
} as const;

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const Heading: React.FC<HeadingProps> = ({
  as: Component = 'h2',
  size,
  align = 'left',
  children,
  className = '',
}) => {
  const defaultSize = headingDefaultSizes[Component];
  const sizeClass = headingSizeStyles[size || defaultSize];
  const baseStyles = 'font-bold text-primary-800';
  const alignClass = alignStyles[align];

  return (
    <Component
      className={`${baseStyles} ${sizeClass} ${alignClass} ${className}`}
    >
      {children}
    </Component>
  );
};

// ========== TEXT COMPONENT ==========

/**
 * Text Component
 *
 * Semantic text component for body content.
 *
 * @example
 * ```tsx
 * <Text>Default body text</Text>
 * <Text size="sm" color="muted">Small muted text</Text>
 * <Text size="lg" color="primary">Large primary text</Text>
 * ```
 */

export interface TextProps {
  /**
   * Text size
   * - xs: text-xs
   * - sm: text-sm
   * - base: text-base (default)
   * - lg: text-lg
   * - xl: text-xl
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';

  /**
   * Text color variant
   * - default: Standard black text
   * - muted: Muted/gray text
   * - primary: Primary brand color
   */
  color?: 'default' | 'muted' | 'primary';

  /**
   * Font weight
   */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';

  /**
   * Text alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Text content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Element to render as
   */
  as?: 'p' | 'span' | 'div';
}

const textSizeStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const textColorStyles = {
  default: 'text-black',
  muted: 'text-black-muted/70',
  primary: 'text-primary-700',
};

const textWeightStyles = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Text: React.FC<TextProps> = ({
  size = 'base',
  color = 'default',
  weight = 'normal',
  align = 'left',
  children,
  className = '',
  as: Component = 'p',
}) => {
  const sizeClass = textSizeStyles[size];
  const colorClass = textColorStyles[color];
  const weightClass = textWeightStyles[weight];
  const alignClass = alignStyles[align];

  return (
    <Component
      className={`${sizeClass} ${colorClass} ${weightClass} ${alignClass} ${className}`}
    >
      {children}
    </Component>
  );
};

// ========== LINK COMPONENT ==========

/**
 * Link Component
 *
 * Accessible link component with glass hover effects.
 *
 * @example
 * ```tsx
 * <Link href="/about">About Page</Link>
 * <Link href="https://example.com" external>External Link</Link>
 * ```
 */

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Link destination
   */
  href: string;

  /**
   * Link content
   */
  children: React.ReactNode;

  /**
   * External link (opens in new tab)
   */
  external?: boolean;

  /**
   * Link style variant
   * - default: Standard link with underline
   * - subtle: No underline, hover only
   */
  variant?: 'default' | 'subtle';

  /**
   * Additional CSS classes
   */
  className?: string;
}

const linkVariantStyles = {
  default: `
    text-primary-600
    underline decoration-primary-300
    hover:text-primary-700 hover:decoration-primary-500
    focus:text-primary-800
    transition-all
  `,
  subtle: `
    text-primary-600
    no-underline
    hover:text-primary-700 hover:underline hover:decoration-primary-500
    focus:text-primary-800
    transition-all
  `,
};

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  external = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantClass = linkVariantStyles[variant].replace(/\s+/g, ' ').trim();
  const baseStyles =
    'font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm';
  const externalAttrs = external
    ? {
        target: '_blank',
        rel: 'noopener noreferrer',
        'aria-label': `${children} (opens in new tab)`,
      }
    : {};

  return (
    <a
      href={href}
      className={`${baseStyles} ${variantClass} ${className}`}
      {...externalAttrs}
      {...props}
    >
      {children}
      {external && (
        <span className="ml-1" aria-hidden="true">
          ↗
        </span>
      )}
    </a>
  );
};
