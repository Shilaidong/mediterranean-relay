'use client';

type Props = {
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
};

export function RelaySlider({
  min = 0,
  max = 100,
  value,
  onChange,
  label = 'Archive Collection',
}: Props) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <div className="flex items-center justify-between">
      <span className="shrink-0 text-[12px] font-serif italic opacity-60">
        {label} · 档案密度
      </span>
      <div className="ml-6 flex h-8 flex-1 items-center rounded-full bg-paper px-4 shadow-neumo-inset">
        <span className="text-[10px] opacity-40">{min}</span>
        <div className="relative mx-4 flex-1">
          <div className="blueprint-track absolute left-0 right-0 top-1/2 h-[1.5px] -translate-y-1/2" />
          <div
            className="absolute left-0 top-1/2 h-[1.5px] -translate-y-1/2 bg-ink"
            style={{ width: `${ratio * 100}%` }}
          />
          <div
            className="blueprint-thumb pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${ratio * 100}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(event) => onChange(Number(event.target.value))}
            className="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
            aria-label={label}
          />
        </div>
        <span className="text-[10px] opacity-40">{max}</span>
      </div>
    </div>
  );
}
