export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-6 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[52rem]">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display mt-4 text-[2.35rem] font-bold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-[3.35rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--ink-soft)] sm:text-[0.95rem] sm:leading-7">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2 md:pb-1">{actions}</div> : null}
    </header>
  );
}
