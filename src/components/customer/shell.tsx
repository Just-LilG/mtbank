"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/components/bank-provider";
import { CustomerNav } from "@/components/customer/nav";
import { DashboardSkeleton } from "@/components/customer/dashboard-skeleton";

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const bank = useBank();
  const router = useRouter();

  useEffect(() => {
    if (bank.ready && !bank.me) router.replace("/");
  }, [bank.ready, bank.me, router]);

  return (
    <div className="min-h-dvh bg-[#e7e1d4]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-paper shadow-[0_0_0_1px_rgba(22,19,15,0.06)] md:max-w-3xl md:shadow-[0_0_60px_-15px_rgba(22,19,15,0.25)] xl:max-w-5xl">
        {bank.me?.status === "Frozen" && (
          <p className="bg-red px-5 py-3 text-sm text-white">
            This account is frozen. You can look, but you cannot send or spend until the branch opens it.
          </p>
        )}
        <div className="flex flex-1 flex-col md:flex-row-reverse">
          <div className="min-w-0 flex-1 md:mx-auto md:w-full md:max-w-2xl xl:max-w-3xl">
            {bank.ready ? children : <DashboardSkeleton />}
          </div>
          <CustomerNav />
        </div>
      </div>
    </div>
  );
}
