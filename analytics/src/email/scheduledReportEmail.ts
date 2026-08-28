import type { SavedReport } from "../repositories/savedReportRepository.js";
import { executeReportQuery } from "../views/reportQuery.js";
import { renderReportResultTable } from "../reports/resultTable.js";
import type { OutboundEmail } from "./mailer.js";

function stripTags(html: string): string {
  return html.replaceAll(/<[^>]+>/g, " ").replaceAll(/\s+/g, " ").trim();
}

export function renderScheduledReportEmail(report: SavedReport): OutboundEmail {
  const result = executeReportQuery(report.querySpec);
  const table = renderReportResultTable(result, report.layout);
  const html = `<article>
    <h1>${report.name}</h1>
    <p>Scheduled analytics report for your workspace.</p>
    ${table}
  </article>`;
  return {
    to: [],
    subject: `Report: ${report.name}`,
    html,
    text: stripTags(html),
  };
}
