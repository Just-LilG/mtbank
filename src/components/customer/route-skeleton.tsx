import { DashboardSkeleton } from "@/components/customer/dashboard-skeleton";
import { PageSkeleton } from "@/components/page-skeleton";
import { Skeleton } from "@/components/skeleton";

function ActivitySkeleton() {
  return (
    <div className="px-5 pb-8 pt-7">
      <Skeleton className="h-8 w-28" />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Skeleton className="h-[68px] rounded-[20px]" />
        <Skeleton className="h-[68px] rounded-[20px]" />
      </div>
      <Skeleton className="mt-4 h-11 w-full rounded-full" />
      <div className="mt-3 flex gap-2 overflow-hidden">
        {["w-16", "w-24", "w-24", "w-20"].map((width, index) => (
          <Skeleton key={index} className={`h-9 shrink-0 rounded-full ${width}`} />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[60px] w-full rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="px-5 pb-8 pt-7">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="mt-6 h-[190px] w-full rounded-[22px]" />
      <Skeleton className="mt-6 h-[96px] w-full rounded-[22px]" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-[84px] rounded-[22px]" />
        <Skeleton className="h-[84px] rounded-[22px]" />
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="px-5 pb-8 pt-7">
      <Skeleton className="h-8 w-24" />
      <div className="mt-6 flex flex-col items-center">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="mt-4 h-6 w-44" />
        <Skeleton className="mt-3 h-7 w-32 rounded-full" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Skeleton className="h-[72px] rounded-[24px]" />
        <Skeleton className="h-[72px] rounded-[24px]" />
      </div>
      <Skeleton className="mt-4 h-[190px] w-full rounded-[24px]" />
      <Skeleton className="mt-4 h-[56px] w-full rounded-[24px]" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="px-5 pb-8 pt-7">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="mt-6 h-[70px] w-full rounded-[22px]" />
      <div className="mt-6 space-y-5">
        <Skeleton className="h-[52px] w-full rounded-2xl" />
        <Skeleton className="h-[52px] w-full rounded-2xl" />
        <Skeleton className="h-[52px] w-full rounded-2xl" />
      </div>
      <Skeleton className="mt-8 h-[50px] w-full rounded-full" />
    </div>
  );
}

/** A placeholder that has the same shape as the screen that is about to appear. */
export function RouteSkeleton({ path }: { path: string }) {
  if (path === "/customer") return <DashboardSkeleton />;
  if (path.startsWith("/customer/activity")) return <ActivitySkeleton />;
  if (path.startsWith("/customer/cards")) return <CardsSkeleton />;
  if (path.startsWith("/customer/profile")) return <ProfileSkeleton />;
  if (path.startsWith("/customer/send") || path.startsWith("/customer/move")) return <FormSkeleton />;
  return <PageSkeleton />;
}
