import { Skeleton } from "@/components/skeleton";

export function DeskSkeleton() {
  return (
    <div className="px-5 py-7 sm:px-8">
      <Skeleton className="h-3 w-32" />
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <Skeleton className="h-11 w-40" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[24px] border border-line bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[24px] border border-line bg-card p-5">
            <Skeleton className="h-6 w-40" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-4 rounded-[24px] border border-line bg-card p-5">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-3 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
