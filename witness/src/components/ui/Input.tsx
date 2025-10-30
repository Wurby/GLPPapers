import React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input type variant
   */
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

  /**
   * Input value
   */
  value?: string;

  /**
   * Change handler
   */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Optional icon (typically for search inputs)
   */
  icon?: React.ReactNode;

  /**
   * Label for accessibility
   */
  label?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  label,
  error,
  helperText,
  className = '',
  disabled = false,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const baseStyles = `
    w-full
    px-3 py-2
    text-base
    bg-white
    border border-primary-200
    rounded-lg
    placeholder:text-black-muted
    focus:outline-none
    focus:ring-1
    focus:ring-primary-500
    focus:border-primary-400
    focus:glow-primary
    disabled:bg-primary-50/50
    disabled:border-primary-100/50
    disabled:text-black-muted
    disabled:cursor-not-allowed
    disabled:placeholder:text-black-muted/50
  `
    .replace(/\s+/g, ' ')
    .trim();

  const errorStyles = error
    ? 'border-warning focus:ring-warning text-warning'
    : '';
  const iconStyles = icon ? 'pl-10' : '';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-primary-800 mb-2"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={errorId || helperId}
          aria-invalid={error ? 'true' : 'false'}
          className={`${baseStyles} ${errorStyles} ${iconStyles}`}
          {...props}
        />
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-sm text-warning" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-2 text-sm text-black-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};
