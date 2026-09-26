import { CustomerShell } from "@/components/customer/shell";

export default function CustomerAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerShell>{children}</CustomerShell>;
}
