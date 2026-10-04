"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBank } from "@/components/bank-provider";
import { DeskSkeleton } from "@/components/staff/desk-skeleton";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const bank = useBank();
  const router = useRouter();

  useEffect(() => {
    if (bank.ready && bank.role !== "staff") router.replace("/staff/login");
  }, [bank.ready, bank.role, router]);

  if (!bank.ready || bank.role !== "staff") {
    return <DeskSkeleton />;
  }

  return children;
}
