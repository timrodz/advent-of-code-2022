import type { ReportLayout } from "./contracts.js";
import { layoutToQuerySpec } from "./contracts.js";
import { handleReportQueryApi } from "../api/reportQueryApi.js";
import type { ReportQueryResult } from "./contracts.js";

function headerLabel(key: string): string {
  return key.replaceAll("_", " ");
}

export function renderReportResultTable(result: ReportQueryResult, layout: ReportLayout): string {
  const dimHeaders = [...layout.rows, ...layout.columns];
  const metricHeaders = layout.metrics;
  const thead = [...dimHeaders, ...metricHeaders]
    .map((h) => `<th>${headerLabel(h)}</th>`)
    .join("");
  const body = result.rows
    .map((row) => {
      const cells = [
        ...dimHeaders.map((d) => `<td>${row.dimensions[d] ?? ""}</td>`),
        ...metricHeaders.map((m) => `<td>${row.metrics[m] ?? ""}</td>`),
      ].join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="report-result-table">
    <thead><tr>${thead}</tr></thead>
    <tbody>${body}</tbody>
  </table>`;
}

export function renderLiveReportFromLayout(
  workspaceToken: string,
  workspaceId: string,
  layout: ReportLayout,
): string {
  const spec = layoutToQuerySpec(workspaceId, layout);
  const response = handleReportQueryApi("POST", "/api/reports/query", workspaceToken, spec);
  if (response.status !== 200) {
    return `<p class="report-error">Unable to load report.</p>`;
  }
  return renderReportResultTable(response.body as ReportQueryResult, layout);
}

export function renderReportBuilder(workspaceToken: string, workspaceId: string, layout: ReportLayout): string {
  return `<section class="custom-report-builder">
    ${renderLiveReportFromLayout(workspaceToken, workspaceId, layout)}
  </section>`;
}
