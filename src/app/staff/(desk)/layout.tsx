import { StaffGate } from "@/components/staff/gate";
import { StaffNav } from "@/components/staff/nav";

export default function StaffDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper md:flex">
      <StaffNav />
      <div className="min-w-0 flex-1">
        <StaffGate>{children}</StaffGate>
      </div>
    </div>
  );
}
