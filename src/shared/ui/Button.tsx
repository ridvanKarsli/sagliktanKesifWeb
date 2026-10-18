import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'icon' | 'plain';

export function Button({
  variant = 'plain',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const cls = ['btn', variant === 'plain' ? '' : variant, className].filter(Boolean).join(' ');
  return <button type="button" className={cls} {...rest} />;
}
