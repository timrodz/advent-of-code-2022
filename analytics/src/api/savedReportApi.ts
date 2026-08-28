import { authenticate, requireTeamAdmin, type AuthContext } from "../auth/teamAdmin.js";
import type { ReportLayout } from "../reports/contracts.js";
import { layoutToQuerySpec } from "../reports/contracts.js";
import {
  SavedReportForbiddenError,
  SavedReportNotFoundError,
  savedReports,
  type SavedReport,
} from "../repositories/savedReportRepository.js";
import type { JsonResponse } from "./dashboardApi.js";

function json(status: number, body: unknown): JsonResponse {
  return { status, body };
}

function canView(auth: AuthContext, report: SavedReport): boolean {
  if (report.workspaceId !== auth.workspaceId) return false;
  return report.ownerId === auth.userId || report.sharedWith.includes(auth.userId);
}

export function handleSavedReportApi(
  method: string,
  path: string,
  token: string | undefined,
  body: unknown,
): JsonResponse {
  try {
    const auth = authenticate(token);

    if (path === "/api/reports/saved" && method === "POST") {
      requireTeamAdmin(auth);
      const payload = body as { name?: string; layout?: ReportLayout };
      if (!payload?.name || !payload.layout) {
        return json(400, { error: "name and layout are required" });
      }
      const report = savedReports.create({
        workspaceId: auth.workspaceId,
        ownerId: auth.userId,
        name: payload.name,
        layout: payload.layout,
        querySpec: layoutToQuerySpec(auth.workspaceId, payload.layout),
      });
      return json(201, report);
    }

    if (path === "/api/reports/saved" && method === "GET") {
      if (auth.role === "team_admin") {
        return json(200, {
          mine: savedReports.listByOwner(auth.workspaceId, auth.userId),
          sharedWithMe: savedReports.listSharedWith(auth.workspaceId, auth.userId),
        });
      }
      return json(200, {
        mine: [],
        sharedWithMe: savedReports.listSharedWith(auth.workspaceId, auth.userId),
      });
    }

    const openMatch = path.match(/^\/api\/reports\/saved\/([^/]+)$/);
    if (openMatch && method === "GET") {
      const report = savedReports.get(openMatch[1]);
      if (!report) throw new SavedReportNotFoundError(openMatch[1]);
      if (!canView(auth, report)) throw new SavedReportForbiddenError();
      return json(200, {
        report,
        readOnly: report.ownerId !== auth.userId,
      });
    }

    const shareMatch = path.match(/^\/api\/reports\/saved\/([^/]+)\/share$/);
    if (shareMatch && method === "POST") {
      requireTeamAdmin(auth);
      const report = savedReports.get(shareMatch[1]);
      if (!report) throw new SavedReportNotFoundError(shareMatch[1]);
      if (report.ownerId !== auth.userId) {
        throw new SavedReportForbiddenError("Only the owner can share this report");
      }
      const payload = body as { memberIds?: string[] };
      const memberIds = payload?.memberIds ?? [];
      report.sharedWith = [...new Set(memberIds)];
      return json(200, savedReports.update(report));
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return json(status, { error: (error as Error).message });
  }
}
