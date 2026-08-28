import { getAlignmentScoreRecord } from "../dashboard/alignmentDataSource.js";
import { readEngagementHeatmap } from "../views/engagementHeatmapView.js";
import { handleDashboardApi } from "../api/dashboardApi.js";
import {
  composeWeeklyInsightSummary,
  type WeeklyInsightSummary,
} from "./weeklyInsightSummary.js";

function weekWindow(now = new Date()): { weekStart: string; weekEnd: string } {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 7);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}

/**
 * Assembles a typed WeeklyInsightSummary from the four live dashboard metric
 * surfaces for one workspace and one week window.
 */
export function composeWeeklyInsightsForWorkspace(
  adminToken: string,
  workspaceId: string,
  now = new Date(),
): WeeklyInsightSummary | null {
  const { weekStart, weekEnd } = weekWindow(now);
  const lifecycleRes = handleDashboardApi("GET", "/api/dashboard/lifecycle", adminToken);
  const velocityRes = handleDashboardApi("GET", "/api/dashboard/velocity", adminToken);
  if (lifecycleRes.status !== 200 || velocityRes.status !== 200) return null;

  const alignment = getAlignmentScoreRecord(workspaceId);
  const heatmap = readEngagementHeatmap(workspaceId);
  const totalContributions = heatmap
    ? heatmap.cells.reduce((sum, c) => sum + c.contributionCount, 0)
    : 0;
  const peak = heatmap
    ? heatmap.activeUsers.reduce(
        (best, row) => (row.activeUserCount > best.activeUserCount ? row : best),
        { bucket: "", activeUserCount: -1 },
      )
    : { bucket: "", activeUserCount: 0 };

  return composeWeeklyInsightSummary(workspaceId, weekStart, weekEnd, {
    lifecycle: lifecycleRes.body as WeeklyInsightSummary["lifecycle"],
    velocity: velocityRes.body as WeeklyInsightSummary["velocity"],
    alignment: {
      workspaceAverageScore: alignment?.workspaceAverageScore ?? 0,
      medianTimeToAlignmentHours: alignment?.medianTimeToAlignmentHours ?? 0,
      stallCalloutCount: alignment?.stallCalloutCount ?? 0,
    },
    engagement: {
      totalContributions,
      peakActiveUsers: Math.max(0, peak.activeUserCount),
      peakBucket: peak.bucket || null,
    },
  });
}
