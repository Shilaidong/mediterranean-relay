export function useHaptic() {
  return (ms: number = 15) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };
}
