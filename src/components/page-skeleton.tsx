import { Skeleton } from "@/components/skeleton";

export function PageSkeleton() {
  return (
    <div className="px-5 pb-8 pt-7">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-10 w-40" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}
