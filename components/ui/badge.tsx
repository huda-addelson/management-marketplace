import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "orange" | "red";
  className?: string;
}) {
  const tones = {
    neutral: "border-black/[0.06] bg-black/[0.045] text-[var(--ink-soft)]",
    green: "border-[#86d3a7]/35 bg-[var(--mint)] text-[var(--forest)]",
    orange: "border-[#f1a088]/30 bg-[#fff0eb] text-[var(--clay-dark)]",
    red: "border-[#df8b86]/30 bg-[var(--danger-soft)] text-[#a63d38]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.09em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
