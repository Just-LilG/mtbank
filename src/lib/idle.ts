/** The choices for how long the app may sit quiet before signing out. */
export const IDLE_CHOICES = [2, 5, 10, 15] as const;
export const IDLE_KEY = "ubex:idle";
export const IDLE_EVENT = "ubex:idle-changed";

export function readIdleMinutes(fallback: number) {
  try {
    const saved = Number(localStorage.getItem(IDLE_KEY));
    return (IDLE_CHOICES as readonly number[]).includes(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}
