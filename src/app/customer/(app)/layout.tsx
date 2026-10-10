import { CustomerShell } from "@/components/customer/shell";
import { IdleGuard } from "@/components/idle-guard";

export default function CustomerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomerShell>
      <IdleGuard minutes={5} adjustable />
      {children}
    </CustomerShell>
  );
}
