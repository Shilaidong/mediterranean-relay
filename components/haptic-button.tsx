'use client';

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  pulse?: number;
};

export function HapticButton({
  className,
  pulse = 12,
  onClick,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`transition-transform active:scale-[0.97] ${className ?? ''}`}
      onClick={(event) => {
        if (navigator.vibrate) {
          navigator.vibrate(pulse);
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}
