import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className = '',
  variant = 'secondary',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' }) {
  return <button type={type} className={`button ${variant} ${className}`} {...props} />;
}
