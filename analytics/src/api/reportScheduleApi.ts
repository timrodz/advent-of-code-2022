import { authenticate, requireTeamAdmin } from "../auth/teamAdmin.js";
import {
  ReportScheduleNotFoundError,
  reportSchedules,
  type ScheduleCadence,
  type ScheduleStatus,
} from "../repositories/reportScheduleRepository.js";
import { savedReports } from "../repositories/savedReportRepository.js";
import type { JsonResponse } from "./dashboardApi.js";

function json(status: number, body: unknown): JsonResponse {
  return { status, body };
}

function nextRunFromCadence(cadence: ScheduleCadence, from = new Date()): string {
  const next = new Date(from);
  if (cadence === "daily") next.setDate(next.getDate() + 1);
  else next.setDate(next.getDate() + 7);
  return next.toISOString();
}

export function handleReportScheduleApi(
  method: string,
  path: string,
  token: string | undefined,
  body: unknown,
): JsonResponse {
  try {
    const auth = authenticate(token);
    requireTeamAdmin(auth);

    const listMatch = path.match(/^\/api\/reports\/saved\/([^/]+)\/schedules$/);
    if (listMatch && method === "GET") {
      const report = savedReports.get(listMatch[1]);
      if (!report || report.workspaceId !== auth.workspaceId) {
        return json(404, { error: "Saved report not found" });
      }
      return json(200, reportSchedules.listBySavedReport(report.id));
    }

    if (listMatch && method === "POST") {
      const report = savedReports.get(listMatch[1]);
      if (!report || report.workspaceId !== auth.workspaceId) {
        return json(404, { error: "Saved report not found" });
      }
      if (report.ownerId !== auth.userId) {
        return json(403, { error: "Only the owner can schedule this report" });
      }
      const payload = body as {
        cadence?: ScheduleCadence;
        recipientEmails?: string[];
        nextRunAt?: string;
      };
      if (!payload?.cadence || !payload.recipientEmails?.length) {
        return json(400, { error: "cadence and recipientEmails are required" });
      }
      const created = reportSchedules.create({
        savedReportId: report.id,
        workspaceId: auth.workspaceId,
        ownerId: auth.userId,
        cadence: payload.cadence,
        status: "active",
        recipientEmails: payload.recipientEmails,
        nextRunAt: payload.nextRunAt ?? nextRunFromCadence(payload.cadence),
      });
      return json(201, created);
    }

    const itemMatch = path.match(/^\/api\/reports\/schedules\/([^/]+)$/);
    if (itemMatch && method === "PATCH") {
      const schedule = reportSchedules.get(itemMatch[1]);
      if (!schedule || schedule.workspaceId !== auth.workspaceId) {
        throw new ReportScheduleNotFoundError(itemMatch[1]);
      }
      if (schedule.ownerId !== auth.userId) {
        return json(403, { error: "Only the owner can update this schedule" });
      }
      const payload = body as {
        cadence?: ScheduleCadence;
        status?: ScheduleStatus;
        recipientEmails?: string[];
        nextRunAt?: string;
      };
      if (payload.cadence) schedule.cadence = payload.cadence;
      if (payload.status) schedule.status = payload.status;
      if (payload.recipientEmails) schedule.recipientEmails = payload.recipientEmails;
      if (payload.nextRunAt) schedule.nextRunAt = payload.nextRunAt;
      return json(200, reportSchedules.update(schedule));
    }

    if (itemMatch && method === "DELETE") {
      const schedule = reportSchedules.get(itemMatch[1]);
      if (!schedule || schedule.workspaceId !== auth.workspaceId) {
        throw new ReportScheduleNotFoundError(itemMatch[1]);
      }
      if (schedule.ownerId !== auth.userId) {
        return json(403, { error: "Only the owner can delete this schedule" });
      }
      reportSchedules.delete(schedule.id);
      return json(204, null);
    }

    return json(404, { error: "Not found" });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return json(status, { error: (error as Error).message });
  }
}

export { nextRunFromCadence };
