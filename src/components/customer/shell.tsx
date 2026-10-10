"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/components/bank-provider";
import { CustomerNav } from "@/components/customer/nav";
import { RouteSkeleton } from "@/components/customer/route-skeleton";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const bank = useBank();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (bank.ready && !bank.me) router.replace("/");
  }, [bank.ready, bank.me, router]);

  return (
    <div className="min-h-dvh app-bg">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col pt-[env(safe-area-inset-top)] app-bg md:max-w-5xl md:shadow-[0_0_60px_-15px_rgba(22,19,15,0.2)] xl:max-w-6xl">
        {bank.me?.status === "Frozen" && (
          <p className="bg-danger px-5 py-3 text-sm text-white">
            This account is frozen. You can look, but you cannot send or spend until the branch opens it.
          </p>
        )}
        <div className="flex flex-1 flex-col md:flex-row-reverse">
          <main id="main" className="min-w-0 flex-1 md:mx-auto md:w-full md:max-w-3xl xl:max-w-4xl">
            {bank.ready ? children : <RouteSkeleton path={path} />}
          </main>
          <CustomerNav />
        </div>
      </div>
    </div>
  );
}
