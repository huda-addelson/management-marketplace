import { apiSuccess } from "@/app/api/_lib/http";

export function GET() {
  return apiSuccess({ status: "ok" });
}
