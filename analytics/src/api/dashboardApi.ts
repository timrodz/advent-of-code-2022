import { authenticate, requireTeamAdmin } from "../auth/teamAdmin.js";
import { getAlignmentScoreRecord } from "../dashboard/alignmentDataSource.js";
import { readEngagementHeatmap } from "../views/engagementHeatmapView.js";

export interface JsonResponse {
  status: number;
  body: unknown;
}

function json(status: number, body: unknown): JsonResponse {
  return { status, body };
}

export function handleDashboardApi(
  method: string,
  path: string,
  token: string | undefined,
): JsonResponse {
  try {
    if (method !== "GET") return json(405, { error: "Method not allowed" });
    const auth = authenticate(token);
    requireTeamAdmin(auth);

    if (path === "/api/dashboard/lifecycle") {
      return json(200, {
        workspaceId: auth.workspaceId,
        averageHoursByStatus: { draft: 8, refining: 20, aligned: 14, delivering: 36 },
        bottleneckStatus: "delivering",
      });
    }
    if (path === "/api/dashboard/velocity") {
      return json(200, {
        workspaceId: auth.workspaceId,
        briefsCompletedPerSprint: 6,
        taskThroughput: 28,
      });
    }
    if (path === "/api/dashboard/alignment") {
      const record = getAlignmentScoreRecord(auth.workspaceId);
      if (!record) return json(404, { error: "Not found" });
      return json(200, record);
    }
    if (path === "/api/dashboard/engagement-heatmap") {
      const snapshot = readEngagementHeatmap(auth.workspaceId);
      if (!snapshot) return json(404, { error: "Not found" });
      return json(200, snapshot);
    }
    return json(404, { error: "Not found" });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return json(status, { error: (error as Error).message });
  }
}
