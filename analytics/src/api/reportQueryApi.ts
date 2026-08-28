import { authenticate, requireTeamAdmin } from "../auth/teamAdmin.js";
import type { ReportQuerySpec } from "../reports/contracts.js";
import { executeReportQuery } from "../views/reportQuery.js";
import type { JsonResponse } from "./dashboardApi.js";

export function handleReportQueryApi(
  method: string,
  path: string,
  token: string | undefined,
  body: unknown,
): JsonResponse {
  try {
    if (path !== "/api/reports/query") return { status: 404, body: { error: "Not found" } };
    if (method !== "POST") return { status: 405, body: { error: "Method not allowed" } };
    const auth = authenticate(token);
    requireTeamAdmin(auth);
    const spec = body as ReportQuerySpec;
    if (!spec || !Array.isArray(spec.dimensions) || !Array.isArray(spec.metrics)) {
      return { status: 400, body: { error: "Invalid ReportQuerySpec" } };
    }
    const scoped: ReportQuerySpec = { ...spec, workspaceId: auth.workspaceId };
    return { status: 200, body: executeReportQuery(scoped) };
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return { status, body: { error: (error as Error).message } };
  }
}
