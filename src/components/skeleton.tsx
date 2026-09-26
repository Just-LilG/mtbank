export function Skeleton({
  className = "",
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`skeleton block rounded-md ${dark ? "opacity-20" : ""} ${className}`}
      style={dark ? { background: "rgba(255,255,255,0.25)", animation: "none" } : undefined}
    />
  );
}
