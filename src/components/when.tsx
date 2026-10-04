"use client";

import { dateTimeLabel, dayLabel, timeLabel } from "@/lib/dates";
import { useMounted } from "@/lib/use-mounted";

/** A timestamp shown in the viewer's own time zone (the server only knows UTC). */
export function When({
  at,
  fallback = "",
  mode = "dateTime",
}: {
  at: string;
  fallback?: string;
  mode?: "dateTime" | "time" | "day";
}) {
  const mounted = useMounted();
  if (!mounted) return <>{fallback}</>;
  const text = mode === "time" ? timeLabel(at) : mode === "day" ? dayLabel(at) : dateTimeLabel(at);
  return <>{text}</>;
}
