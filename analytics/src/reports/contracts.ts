/**
 * Shared contracts coupling the layout builder, query endpoint, and result table.
 * Landed first so UI and API cannot drift (HAM-78).
 */

export const REPORT_DIMENSIONS = ["time_period", "team_member", "brief_status", "initiative"] as const;
export const REPORT_METRICS = ["count", "duration", "completion_rate"] as const;

export type ReportDimension = (typeof REPORT_DIMENSIONS)[number];
export type ReportMetric = (typeof REPORT_METRICS)[number];

export type LayoutZone = "rows" | "columns" | "metrics";

/** How selected dimensions/metrics are arranged on the canvas. */
export interface ReportLayout {
  rows: ReportDimension[];
  columns: ReportDimension[];
  metrics: ReportMetric[];
}

/** Request payload accepted by the custom-report query endpoint. */
export interface ReportQuerySpec {
  workspaceId: string;
  dimensions: ReportDimension[];
  metrics: ReportMetric[];
  filters?: {
    timePeriod?: string;
    teamMemberId?: string;
    briefStatus?: string;
    initiativeId?: string;
  };
}

export interface ReportResultRow {
  dimensions: Partial<Record<ReportDimension, string>>;
  metrics: Partial<Record<ReportMetric, number>>;
}

export interface ReportQueryResult {
  spec: ReportQuerySpec;
  rows: ReportResultRow[];
}

export function emptyLayout(): ReportLayout {
  return { rows: [], columns: [], metrics: [] };
}

export function layoutToQuerySpec(workspaceId: string, layout: ReportLayout): ReportQuerySpec {
  const dimensions = [...layout.rows, ...layout.columns];
  return {
    workspaceId,
    dimensions,
    metrics: [...layout.metrics],
  };
}
