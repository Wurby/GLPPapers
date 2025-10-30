import React from 'react';

export interface CardProps {
  /**
   * Visual style variant
   * - default: Standard card with subtle shadow
   * - bordered: Card with left accent border
   * - hoverable: Interactive card with hover effects
   */
  variant?: 'default' | 'bordered' | 'hoverable';

  /**
   * Internal padding
   * - none: No padding
   * - sm: Small padding (p-4)
   * - md: Medium padding (p-6)
   * - lg: Large padding (p-8)
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Enable hover effects (scales slightly on hover)
   */
  hoverable?: boolean;

  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Click handler (makes card interactive)
   */
  onClick?: () => void;

  /**
   * Element to render as
   */
  as?: 'div' | 'article' | 'section';

  /**
   * Optional action buttons or elements to display at the bottom right corner of the card
   */
  cardActions?: React.ReactNode;
}

const variantStyles = {
  default: `
    bg-white
    border border-primary-200
    shadow-md
  `,
  bordered: `
    border border-primary-200
    border-l-4 border-l-primary-600
    bg-secondary-100
    shadow-md
  `,
  hoverable: `
    bg-white
    border border-primary-200
    shadow-md
    hover:border-primary-500
    hover:shadow-primary-300/50
    transition-all
  `,
};

const paddingStyles = {
  none: '',
  sm: 'px-4 py-2',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  onClick,
  cardActions,
  as: Component = 'div',
}) => {
  const baseStyles = 'rounded-lg flex flex-wrap';
  const variantClass = variantStyles[variant].replace(/\s+/g, ' ').trim();
  const paddingClass = paddingStyles[padding];
  const hoverClass =
    hoverable && variant !== 'hoverable'
      ? 'hover:scale-[1.01] transition-transform cursor-pointer'
      : '';
  const interactiveAttrs = onClick
    ? { onClick, role: 'button', tabIndex: 0 }
    : {};

  return (
    <Component
      className={`${baseStyles} ${variantClass} ${paddingClass} ${hoverClass} ${className}`}
      {...interactiveAttrs}
    >
      {children}
      <div className="mt-4 place-self-end justify-self-end w-full">
        {cardActions && <div>{cardActions}</div>}
      </div>
    </Component>
  );
};
