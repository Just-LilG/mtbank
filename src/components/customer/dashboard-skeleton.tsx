import { Skeleton } from "@/components/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="px-5 pb-6 pt-7">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-2 h-6 w-28" />
          </div>
        </div>
        <Skeleton className="h-11 w-11 rounded-full" />
      </div>

      <div className="mt-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-2 h-11 w-48" />
      </div>

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="mt-3 flex gap-3 overflow-hidden">
          <Skeleton className="h-[150px] w-[250px] shrink-0 rounded-[22px]" />
          <Skeleton className="h-[150px] w-[200px] shrink-0 rounded-[22px]" />
        </div>
      </section>

      <Skeleton className="mt-6 h-[76px] w-full rounded-[24px]" />

      <section className="mt-6 rounded-[24px] bg-ink p-4">
        <Skeleton className="h-3 w-24" dark />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" dark />
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] w-full rounded-[24px]" />
          ))}
        </div>
      </section>
    </div>
  );
}
