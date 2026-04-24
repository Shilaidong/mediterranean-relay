export function StatePanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="paper-panel mx-5 mt-8 p-6 text-center">
      <p className="font-serif text-xl">{title}</p>
      <p className="mt-3 text-sm leading-6 text-ink/60">{body}</p>
    </div>
  );
}
