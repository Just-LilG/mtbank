import { LogoMark } from "@/components/logo";

export function Mark({
  tone = "ink",
}: {
  tone?: "ink" | "light";
}) {
  const light = tone === "light";
  return (
    <div className="flex items-center gap-3">
      <LogoMark tone={tone} className="h-11 w-11 shrink-0 drop-shadow-[0_6px_10px_rgba(20,22,28,0.18)]" />
      <div className="leading-none">
        <p
          className={`font-display text-[1.35rem] leading-none tracking-tight ${
            light ? "text-white" : "text-ink"
          }`}
        >
          UBEX BANK
        </p>
        <p
          className={`mt-1 text-[11px] uppercase tracking-[0.22em] ${
            light ? "text-white/60" : "text-muted"
          }`}
        >
          Osu branch
        </p>
      </div>
    </div>
  );
}
