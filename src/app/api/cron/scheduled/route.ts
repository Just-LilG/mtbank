import { timingSafeEqual } from "node:crypto";
import { runDueSchedules } from "@/lib/scheduled";

export const dynamic = "force-dynamic";

/** Vercel Cron calls this once a day and sends the secret in the Authorization header. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization") ?? "";
  const wanted = `Bearer ${secret ?? ""}`;
  const same = given.length === wanted.length && timingSafeEqual(Buffer.from(given), Buffer.from(wanted));
  if (!secret || !same) return new Response("Unauthorized", { status: 401 });
  return Response.json(await runDueSchedules());
}
