import type { EngagementHeatmapSnapshot } from "../views/engagementHeatmapView.js";

function intensity(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}

export function renderEngagementHeatmap(snapshot: EngagementHeatmapSnapshot): string {
  const max = Math.max(0, ...snapshot.cells.map((c) => c.contributionCount));
  const header = snapshot.buckets.map((b) => `<th>${b}</th>`).join("");
  const body = snapshot.members
    .map((member) => {
      const cells = snapshot.buckets
        .map((bucket) => {
          const cell = snapshot.cells.find(
            (c) => c.memberId === member.memberId && c.bucket === bucket,
          );
          const count = cell?.contributionCount ?? 0;
          return `<td class="heat-cell" data-intensity="${intensity(count, max)}" title="${count} contributions">${count}</td>`;
        })
        .join("");
      return `<tr><th scope="row">${member.memberName}</th>${cells}</tr>`;
    })
    .join("");

  const active = snapshot.activeUsers
    .map((row) => `<li>${row.bucket}: ${row.activeUserCount} active</li>`)
    .join("");

  return `<section class="engagement-heatmap" aria-labelledby="engagement-heading">
    <h2 id="engagement-heading">Engagement</h2>
    <p class="active-users">Active users by day</p>
    <ul class="active-user-counts">${active}</ul>
    <table class="heatmap-grid">
      <thead><tr><th>Member</th>${header}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </section>`;
}
