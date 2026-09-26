export function Mark({
  tone = "ink",
}: {
  tone?: "ink" | "light";
}) {
  const light = tone === "light";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl ${
          light ? "bg-white text-red" : "bg-red text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <path d="M14.5 3a4.5 4.5 0 0 0-4.4 5.4L4 14.5V20h5.5l1.2-1.2a4.5 4.5 0 0 0 5.3-6.3A4.5 4.5 0 0 0 14.5 3Zm0 2.2a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6ZM7.2 16.2h1.6v1.6H7.2v-1.6Z" />
        </svg>
      </span>
      <div className="leading-none">
        <div>
          <p
            className={`font-display text-[1.35rem] leading-none tracking-tight ${
              light ? "text-white" : "text-ink"
            }`}
          >
            UBEX BANK
          </p>
          <p
            className={`mt-1 text-[10px] uppercase tracking-[0.22em] ${
              light ? "text-white/60" : "text-muted"
            }`}
          >
            Osu branch
          </p>
        </div>
      </div>
    </div>
  );
}
