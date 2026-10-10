import Link from "next/link";
import { IconChevronLeft } from "@/components/icons";

/** The title row used on screens that open from Profile: a back button and a heading. */
export function PageTop({ title, back = "/customer/profile" }: { title: string; back?: string }) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href={back}
        aria-label="Back"
        className="grid h-11 w-11 place-items-center rounded-full border border-line bg-card text-ink shadow-sm"
      >
        <IconChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-2xl tracking-tight">{title}</h1>
    </div>
  );
}
