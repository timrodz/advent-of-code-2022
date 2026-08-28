import {
  getAlignmentScoreRecord,
  toAlignmentVisualizationModel,
} from "./alignmentDataSource.js";
import { renderAlignmentScoreVisualization } from "./alignmentScoreVisualization.js";
import { renderEngagementHeatmap } from "./engagementHeatmap.js";
import { readEngagementHeatmap } from "../views/engagementHeatmapView.js";

export interface LifecycleMetrics {
  averageHoursByStatus: Record<string, number>;
  bottleneckStatus: string;
}

export interface VelocityMetrics {
  briefsCompletedPerSprint: number;
  taskThroughput: number;
}

export function renderEngagementHeatmapSlot(workspaceId: string): string {
  const snapshot = readEngagementHeatmap(workspaceId);
  if (!snapshot) {
    return `<section class="engagement-heatmap" aria-label="Engagement heatmap"><h2>Engagement</h2><p>No engagement data.</p></section>`;
  }
  return renderEngagementHeatmap(snapshot);
}

export function renderLifecyclePanel(metrics: LifecycleMetrics): string {
  const rows = Object.entries(metrics.averageHoursByStatus)
    .map(([status, hours]) => `<tr><td>${status}</td><td>${hours}h</td></tr>`)
    .join("");
  return `<section class="lifecycle-metrics"><h2>Brief lifecycle</h2>
    <p>Bottleneck: ${metrics.bottleneckStatus}</p>
    <table><thead><tr><th>Status</th><th>Avg time</th></tr></thead><tbody>${rows}</tbody></table>
  </section>`;
}

export function renderVelocityPanel(metrics: VelocityMetrics): string {
  return `<section class="velocity-metrics"><h2>Team velocity</h2>
    <dl>
      <div><dt>Briefs / sprint</dt><dd>${metrics.briefsCompletedPerSprint}</dd></div>
      <div><dt>Task throughput</dt><dd>${metrics.taskThroughput}</dd></div>
    </dl>
  </section>`;
}

const DEFAULT_LIFECYCLE: LifecycleMetrics = {
  averageHoursByStatus: { draft: 8, refining: 20, aligned: 14, delivering: 36 },
  bottleneckStatus: "delivering",
};

const DEFAULT_VELOCITY: VelocityMetrics = {
  briefsCompletedPerSprint: 6,
  taskThroughput: 28,
};

/**
 * Live core dashboard. Alignment uses the refined visualization wired to
 * the existing alignment score data source (HAM-85).
 */
export function renderCoreDashboard(workspaceId: string): string {
  const alignmentRecord = getAlignmentScoreRecord(workspaceId);
  const alignmentHtml = alignmentRecord
    ? renderAlignmentScoreVisualization(toAlignmentVisualizationModel(alignmentRecord))
    : `<section class="alignment-score-visualization"><p>No alignment data.</p></section>`;

  return `<main class="core-dashboard" data-workspace="${workspaceId}">
    ${renderLifecyclePanel(DEFAULT_LIFECYCLE)}
    ${renderVelocityPanel(DEFAULT_VELOCITY)}
    ${alignmentHtml}
    ${renderEngagementHeatmapSlot(workspaceId)}
  </main>`;
}
