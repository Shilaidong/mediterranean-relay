type PageTitleProps = {
  english: string;
  chinese: string;
  className?: string;
};

type SectionLabelProps = {
  english: string;
  chinese: string;
  count?: string | number;
  className?: string;
};

export function PageTitle({ english, chinese, className = '' }: PageTitleProps) {
  return (
    <header className={`pb-6 pt-10 text-center ${className}`}>
      <h1 className="text-[32px] font-serif font-bold tracking-tight">{english}</h1>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">
        {chinese}
      </p>
    </header>
  );
}

export function SectionLabel({
  english,
  chinese,
  count,
  className = '',
}: SectionLabelProps) {
  return (
    <div className={`mb-4 flex items-center gap-3 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
        {english} · {chinese}
      </span>
      <div className="h-px flex-1 bg-ink/12" />
      {count !== undefined ? (
        <span className="text-[10px] opacity-40">{String(count)}</span>
      ) : null}
    </div>
  );
}
