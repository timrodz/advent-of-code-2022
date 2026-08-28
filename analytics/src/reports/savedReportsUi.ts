import type { ReportLayout } from "./contracts.js";
import { handleSavedReportApi } from "../api/savedReportApi.js";
import { renderLayoutBuilderCanvas, createLayoutBuilder, dropOntoCanvas } from "./layoutBuilder.js";
import type { LayoutBuilderState } from "./layoutBuilder.js";
import { renderLiveReportFromLayout } from "./resultTable.js";
import type { SavedReport } from "../repositories/savedReportRepository.js";

export function saveReportFromBuilder(
  token: string,
  name: string,
  layout: ReportLayout,
): SavedReport {
  const res = handleSavedReportApi("POST", "/api/reports/saved", token, { name, layout });
  if (res.status !== 201) {
    throw new Error(`Unable to save report: ${JSON.stringify(res.body)}`);
  }
  return res.body as SavedReport;
}

export function listSavedReports(token: string): {
  mine: SavedReport[];
  sharedWithMe: SavedReport[];
} {
  const res = handleSavedReportApi("GET", "/api/reports/saved", token, undefined);
  return res.body as { mine: SavedReport[]; sharedWithMe: SavedReport[] };
}

export function reopenSavedReport(
  token: string,
  reportId: string,
): { state: LayoutBuilderState; readOnly: boolean; report: SavedReport } {
  const res = handleSavedReportApi("GET", `/api/reports/saved/${reportId}`, token, undefined);
  if (res.status !== 200) {
    throw new Error(`Unable to reopen report: ${JSON.stringify(res.body)}`);
  }
  const payload = res.body as { report: SavedReport; readOnly: boolean };
  let state = createLayoutBuilder();
  for (const row of payload.report.layout.rows) {
    state = dropOntoCanvas(state, row, "rows");
  }
  for (const col of payload.report.layout.columns) {
    state = dropOntoCanvas(state, col, "columns");
  }
  for (const metric of payload.report.layout.metrics) {
    state = dropOntoCanvas(state, metric, "metrics");
  }
  return { state, readOnly: payload.readOnly, report: payload.report };
}

export function renderSavedReportsUi(
  token: string,
  workspaceId: string,
  selected?: { state: LayoutBuilderState; readOnly: boolean },
): string {
  const lists = listSavedReports(token);
  const mine = lists.mine.map((r) => `<li data-report-id="${r.id}">${r.name}</li>`).join("");
  const shared = lists.sharedWithMe
    .map((r) => `<li data-report-id="${r.id}" data-shared="true">${r.name} (shared)</li>`)
    .join("");
  const canvas = selected
    ? renderLayoutBuilderCanvas(selected.state)
    : "";
  const table = selected
    ? renderLiveReportFromLayout(token, workspaceId, selected.state.layout)
    : "";
  const mode = selected?.readOnly ? "read-only" : "editable";
  return `<section class="saved-reports">
    <h2>My reports</h2><ul class="saved-report-list">${mine}</ul>
    <h2>Shared with me</h2><ul class="shared-with-me">${shared}</ul>
    ${selected ? `<p data-mode="${mode}"></p>${canvas}${table}` : ""}
  </section>`;
}
