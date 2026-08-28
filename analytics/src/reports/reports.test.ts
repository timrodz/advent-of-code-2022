import { describe, expect, it } from "vitest";
import {
  emptyLayout,
  layoutToQuerySpec,
  REPORT_DIMENSIONS,
  REPORT_METRICS,
} from "./contracts.js";
import {
  createLayoutBuilder,
  dropOntoCanvas,
  renderLayoutBuilderCanvas,
} from "./layoutBuilder.js";
import { renderLiveReportFromLayout } from "./resultTable.js";
import { handleReportQueryApi } from "../api/reportQueryApi.js";
import { executeReportQuery } from "../views/reportQuery.js";

describe("ReportLayout and ReportQuerySpec contracts", () => {
  it("exposes the supported dimensions and metrics", () => {
    expect(REPORT_DIMENSIONS).toEqual([
      "time_period",
      "team_member",
      "brief_status",
      "initiative",
    ]);
    expect(REPORT_METRICS).toEqual(["count", "duration", "completion_rate"]);
    const layout = emptyLayout();
    layout.rows.push("brief_status");
    layout.columns.push("time_period");
    layout.metrics.push("count");
    const spec = layoutToQuerySpec("ws_demo", layout);
    expect(spec.workspaceId).toBe("ws_demo");
    expect(spec.dimensions).toEqual(["brief_status", "time_period"]);
    expect(spec.metrics).toEqual(["count"]);
  });
});

describe("custom report query execution", () => {
  it("aggregates facts from the materialized view layer", () => {
    const result = executeReportQuery({
      workspaceId: "ws_demo",
      dimensions: ["initiative"],
      metrics: ["count", "completion_rate"],
    });
    const analytics = result.rows.find((r) => r.dimensions.initiative === "Analytics");
    expect(analytics?.metrics.count).toBe(5);
    expect(analytics?.metrics.completion_rate).toBe(0.6);
  });

  it("scopes the HTTP endpoint to the team-admin workspace", () => {
    const denied = handleReportQueryApi("POST", "/api/reports/query", "u_member", {
      workspaceId: "ws_demo",
      dimensions: ["brief_status"],
      metrics: ["count"],
    });
    expect(denied.status).toBe(403);
    const ok = handleReportQueryApi("POST", "/api/reports/query", "u_admin", {
      workspaceId: "ws_other",
      dimensions: ["brief_status"],
      metrics: ["count"],
    });
    expect(ok.status).toBe(200);
    const body = ok.body as { spec: { workspaceId: string }; rows: unknown[] };
    expect(body.spec.workspaceId).toBe("ws_demo");
    expect(body.rows.length).toBeGreaterThan(0);
  });
});

describe("drag-and-drop layout builder", () => {
  it("arranges selected fields into rows, columns, and metrics", () => {
    let state = createLayoutBuilder();
    state = dropOntoCanvas(state, "team_member", "rows");
    state = dropOntoCanvas(state, "time_period", "columns");
    state = dropOntoCanvas(state, "count", "metrics");
    state = dropOntoCanvas(state, "duration", "metrics");
    expect(state.layout).toEqual({
      rows: ["team_member"],
      columns: ["time_period"],
      metrics: ["count", "duration"],
    });
    const html = renderLayoutBuilderCanvas(state);
    expect(html).toContain("data-testid=\"layout-canvas\"");
    expect(html).toContain('data-zone="rows"');
    expect(html).toContain("team_member");
    expect(html).toContain("time_period");
  });
});

describe("live report result table", () => {
  it("turns a ReportLayout into a table via the query endpoint", () => {
    const layout = {
      rows: ["initiative" as const],
      columns: [] as const,
      metrics: ["count" as const, "duration" as const],
    };
    const html = renderLiveReportFromLayout("u_admin", "ws_demo", {
      rows: [...layout.rows],
      columns: [],
      metrics: [...layout.metrics],
    });
    expect(html).toContain("report-result-table");
    expect(html).toContain("Analytics");
    expect(html).toContain("Growth");
    expect(html).toContain("count");
  });
});
