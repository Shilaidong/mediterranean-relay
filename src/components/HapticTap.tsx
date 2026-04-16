import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useHaptic } from '../hooks/useHaptic';

type HapticTapProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  vibrate?: number;
};

export const HapticTap = forwardRef<HTMLButtonElement, HapticTapProps>(
  ({ vibrate = 15, onClick, className = '', children, ...rest }, ref) => {
    const haptic = useHaptic();
    return (
      <button
        ref={ref}
        onClick={(e) => {
          haptic(vibrate);
          onClick?.(e);
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
