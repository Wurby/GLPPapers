import React from 'react';

/**
 * Button Component - Apple Liquid Glass Design
 *
 * A versatile button component with glass morphism effects.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click Me</Button>
 * <Button variant="outline" size="sm">Secondary Action</Button>
 * ```
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * - primary: Terracotta outline that fills on hover (main actions)
   * - secondary: Cream outline that fills on hover (secondary actions)
   * - loading: Shows loading state
   */
  variant?: 'primary' | 'secondary' | 'loading';

  /**
   * Button content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Loading state (only for loading variant)
   */
  isLoading?: boolean;
}

const variantStyles = {
  primary: `
    bg-transparent text-primary-700
    border-2 border-primary-600
    hover:bg-primary-600 hover:text-white hover:shadow-md
    active:bg-primary-700
    transition-all duration-200
    cursor-pointer
    disabled:bg-transparent disabled:border-2 disabled:border-primary-200 disabled:text-primary-300 disabled:cursor-not-allowed disabled:opacity-60
  `,
  secondary: `
    bg-transparent text-secondary-700
    border-2 border-secondary-400
    hover:bg-secondary-300 hover:text-primary-800 hover:shadow-md
    active:bg-secondary-400
    transition-all duration-200
    cursor-pointer
    disabled:bg-transparent disabled:border-2 disabled:border-secondary-300 disabled:text-secondary-500 disabled:cursor-not-allowed disabled:opacity-70
  `,
  loading: `
    bg-primary-600 text-white
    border-2 border-primary-700
    shadow-sm
  
    cursor-wait
    opacity-75
  `,
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  disabled = false,
  isLoading = false,
  ...props
}) => {
  const baseStyles =
    'px-4 py-1 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
  const actualVariant = isLoading ? 'loading' : variant;
  const variantClass = variantStyles[actualVariant].replace(/\s+/g, ' ').trim();

  return (
    <button
      className={`${baseStyles} ${variantClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="inline-block w-4 h-4 mr-2 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
