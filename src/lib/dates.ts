const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

export const dayKey = (at: string) => String(startOfDay(new Date(at)));

/** "Today", "Yesterday", "Monday", "Sep 25" — always in the viewer's own time zone. */
export function dayLabel(at: string) {
  const day = new Date(at);
  const today = new Date();
  const gap = Math.round((startOfDay(today) - startOfDay(day)) / 86_400_000);
  if (gap === 0) return "Today";
  if (gap === 1) return "Yesterday";
  return day.toLocaleDateString(undefined, {
    weekday: gap < 7 ? "long" : undefined,
    month: "short",
    day: "numeric",
    year: day.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export const timeLabel = (at: string) =>
  new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export const dateTimeLabel = (at: string) =>
  new Date(at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const fullDateLabel = (at: string) =>
  new Date(at).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
