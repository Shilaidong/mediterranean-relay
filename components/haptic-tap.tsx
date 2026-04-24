'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';

type HapticTapProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  vibrate?: number;
};

export const HapticTap = forwardRef<HTMLButtonElement, HapticTapProps>(
  ({ vibrate = 15, onClick, className = '', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        onClick={(event) => {
          if (navigator.vibrate) {
            navigator.vibrate(vibrate);
          }
          onClick?.(event);
        }}
        className={`active:scale-95 transition-transform duration-200 ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

HapticTap.displayName = 'HapticTap';
