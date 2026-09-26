import { CustomerFile } from "@/components/staff/customer-file";

export default async function CustomerFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerFile id={id} />;
}
