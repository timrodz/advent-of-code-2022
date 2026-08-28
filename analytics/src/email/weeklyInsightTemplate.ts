import type { WeeklyInsightSummary } from "../insights/weeklyInsightSummary.js";
import type { OutboundEmail } from "./mailer.js";

function statusRows(hours: Record<string, number>): string {
  return Object.entries(hours)
    .map(([status, value]) => `<li>${status}: ${value}h</li>`)
    .join("");
}

export function renderWeeklyInsightEmail(summary: WeeklyInsightSummary): Omit<OutboundEmail, "to"> {
  const html = `<article class="weekly-insight-summary">
    <h1>Weekly workspace insights</h1>
    <p>${summary.weekStart} → ${summary.weekEnd}</p>
    <section>
      <h2>Lifecycle</h2>
      <p>Bottleneck: <strong>${summary.lifecycle.bottleneckStatus}</strong></p>
      <ul>${statusRows(summary.lifecycle.averageHoursByStatus)}</ul>
    </section>
    <section>
      <h2>Velocity</h2>
      <p>${summary.velocity.briefsCompletedPerSprint} briefs / sprint · ${summary.velocity.taskThroughput} tasks</p>
    </section>
    <section>
      <h2>Alignment</h2>
      <p>Score ${summary.alignment.workspaceAverageScore} · median ${summary.alignment.medianTimeToAlignmentHours}h to align · ${summary.alignment.stallCalloutCount} stalled</p>
    </section>
    <section>
      <h2>Engagement</h2>
      <p>${summary.engagement.totalContributions} contributions · peak ${summary.engagement.peakActiveUsers} active (${summary.engagement.peakBucket ?? "n/a"})</p>
    </section>
  </article>`;

  const text = [
    `Weekly workspace insights ${summary.weekStart} to ${summary.weekEnd}`,
    `Lifecycle bottleneck: ${summary.lifecycle.bottleneckStatus}`,
    `Velocity: ${summary.velocity.briefsCompletedPerSprint} briefs/sprint, ${summary.velocity.taskThroughput} tasks`,
    `Alignment score ${summary.alignment.workspaceAverageScore}, median ${summary.alignment.medianTimeToAlignmentHours}h, ${summary.alignment.stallCalloutCount} stalled`,
    `Engagement: ${summary.engagement.totalContributions} contributions, peak ${summary.engagement.peakActiveUsers} active (${summary.engagement.peakBucket ?? "n/a"})`,
  ].join("\n");

  return {
    subject: `Weekly insights ${summary.weekStart}–${summary.weekEnd}`,
    html,
    text,
  };
}
