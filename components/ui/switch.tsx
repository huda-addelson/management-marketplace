export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const toggle = (
    <>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label || "Aktifkan atau nonaktifkan"}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-6 w-11 shrink-0 rounded-full bg-black/[0.12] transition-all peer-checked:bg-[var(--forest)] peer-focus-visible:ring-4 peer-focus-visible:ring-brand/[0.12] peer-disabled:opacity-40 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
    </>
  );

  if (!label && !description) {
    return <label className="inline-flex cursor-pointer items-center rounded-full p-1">{toggle}</label>;
  }

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-[1rem] border border-[var(--line)] bg-white/[0.65] p-3.5 transition-colors hover:border-[var(--line-strong)] hover:bg-white">
      <span>
        <span className="block text-sm font-bold tracking-[-0.01em] text-[var(--ink)]">{label}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-[var(--ink-soft)]">{description}</span> : null}
      </span>
      <span className="mt-0.5 inline-flex">{toggle}</span>
    </label>
  );
}
