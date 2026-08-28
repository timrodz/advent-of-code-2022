import { describe, expect, it } from "vitest";
import { handleDashboardApi } from "../api/dashboardApi.js";
import { renderCoreDashboard } from "./coreDashboard.js";
import { renderEngagementHeatmap } from "./engagementHeatmap.js";
import {
  engagementHeatmapView,
  readEngagementHeatmap,
} from "../views/engagementHeatmapView.js";
import { REFRESH_INTERVAL_MS } from "../views/materializedViews.js";

describe("engagement heatmap materialized view", () => {
  it("aggregates member × time-bucket contributions and active users per workspace", () => {
    expect(REFRESH_INTERVAL_MS).toBe(15 * 60 * 1000);
    engagementHeatmapView.refresh();
    const snapshot = readEngagementHeatmap("ws_demo");
    expect(snapshot).not.toBeNull();
    expect(snapshot!.members.map((m) => m.memberId).sort()).toEqual(["u_admin", "u_member"]);
    const averyMon = snapshot!.cells.find(
      (c) => c.memberId === "u_admin" && c.bucket === "Mon",
    );
    expect(averyMon?.contributionCount).toBe(2);
    const morganWed = snapshot!.cells.find(
      (c) => c.memberId === "u_member" && c.bucket === "Wed",
    );
    expect(morganWed?.contributionCount).toBe(3);
    expect(snapshot!.activeUsers.find((b) => b.bucket === "Mon")?.activeUserCount).toBe(2);
    expect(readEngagementHeatmap("ws_other")?.cells[0]?.memberId).toBe("u_admin_b");
  });
});

describe("engagement heatmap API", () => {
  it("requires team-admin auth matching the shipped dashboard endpoints", () => {
    expect(handleDashboardApi("GET", "/api/dashboard/engagement-heatmap", undefined).status).toBe(
      401,
    );
    expect(handleDashboardApi("GET", "/api/dashboard/lifecycle", "u_member").status).toBe(403);
    expect(handleDashboardApi("GET", "/api/dashboard/velocity", "u_member").status).toBe(403);
    expect(handleDashboardApi("GET", "/api/dashboard/alignment", "u_member").status).toBe(403);
    expect(
      handleDashboardApi("GET", "/api/dashboard/engagement-heatmap", "u_member").status,
    ).toBe(403);
  });

  it("returns the workspace-scoped contribution matrix for a team admin", () => {
    const res = handleDashboardApi(
      "GET",
      "/api/dashboard/engagement-heatmap",
      "u_admin",
    );
    expect(res.status).toBe(200);
    const body = res.body as { workspaceId: string; cells: Array<{ contributionCount: number }> };
    expect(body.workspaceId).toBe("ws_demo");
    expect(body.cells.length).toBeGreaterThan(0);
  });
});

describe("engagement heatmap dashboard surface", () => {
  it("renders the heatmap beside the other core dashboard surfaces", () => {
    const snapshot = readEngagementHeatmap("ws_demo")!;
    const widget = renderEngagementHeatmap(snapshot);
    expect(widget).toContain("Engagement");
    expect(widget).toContain("Avery Admin");
    expect(widget).toContain("active");
    const page = renderCoreDashboard("ws_demo");
    expect(page).toContain("engagement-heatmap");
    expect(page).toContain("Brief lifecycle");
    expect(page).toContain("Team velocity");
    expect(page).toContain("alignment-score-visualization");
  });
});
