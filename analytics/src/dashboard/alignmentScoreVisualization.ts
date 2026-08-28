import type { AlignmentScoreVisualizationModel } from "./alignmentScoreDesign.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusLabel(status: AlignmentScoreVisualizationModel["briefs"][number]["status"]): string {
  if (status === "aligned") return "Aligned";
  if (status === "diverging") return "Diverging";
  return "In progress";
}

function sparkline(points: AlignmentScoreVisualizationModel["scoreTrend"]): string {
  if (points.length === 0) return "";
  const values = points.map((p) => p.score);
  const max = Math.max(...values, 1);
  return `<ol class="alignment-trend" aria-label="Alignment score trend">${points
    .map((p) => {
      const height = Math.round((p.score / max) * 100);
      return `<li title="${escapeHtml(p.period)}: ${p.score}"><span style="height:${height}%"></span></li>`;
    })
    .join("")}</ol>`;
}

function voteBars(row: AlignmentScoreVisualizationModel["briefs"][number]): string {
  return `<ul class="vote-pattern" aria-label="Voting pattern for ${escapeHtml(row.title)}">${row.votePatterns
    .map((vote) => {
      const pct = Math.round(vote.share * 100);
      return `<li><span class="vote-label">${escapeHtml(vote.optionLabel)}</span><span class="vote-bar"><span style="width:${pct}%"></span></span><span class="vote-count">${vote.voteCount} (${pct}%)</span></li>`;
    })
    .join("")}</ul>`;
}

/**
 * Renders the refined alignment score visualization from a frozen model.
 * Presentation only: no fetching, no aggregation.
 */
export function renderAlignmentScoreVisualization(
  model: AlignmentScoreVisualizationModel,
): string {
  const briefRows = model.briefs
    .map((brief) => {
      const tta =
        brief.timeToAlignmentHours === null
          ? "—"
          : `${brief.timeToAlignmentHours}h`;
      return `<tr>
        <td>${escapeHtml(brief.title)}</td>
        <td>${brief.alignmentScore}</td>
        <td>${tta}</td>
        <td><span class="status-chip status-${brief.status}">${statusLabel(brief.status)}</span></td>
        <td>${voteBars(brief)}</td>
      </tr>`;
    })
    .join("");

  const stall =
    model.stallCalloutCount > 0
      ? `<p class="stall-callout">${model.stallCalloutCount} brief${model.stallCalloutCount === 1 ? "" : "s"} stalled more than 7 days without alignment.</p>`
      : `<p class="stall-callout stall-none">No briefs stalled past the 7-day alignment window.</p>`;

  return `<section class="alignment-score-visualization" data-contract="2026-08-alignment-v2" aria-labelledby="alignment-viz-heading">
    <header>
      <h2 id="alignment-viz-heading">Alignment</h2>
      <dl class="alignment-kpis">
        <div><dt>Workspace score</dt><dd>${model.workspaceAverageScore}</dd></div>
        <div><dt>Median time to alignment</dt><dd>${model.medianTimeToAlignmentHours}h</dd></div>
      </dl>
      ${sparkline(model.scoreTrend)}
    </header>
    ${stall}
    <table class="alignment-briefs">
      <thead>
        <tr>
          <th>Brief</th>
          <th>Score</th>
          <th>Time to alignment</th>
          <th>Status</th>
          <th>Voting pattern</th>
        </tr>
      </thead>
      <tbody>${briefRows}</tbody>
    </table>
  </section>`;
}
