import { listTeamAdmins, listWorkspaces } from "../auth/teamAdmin.js";
import { mailer } from "../email/mailer.js";
import { renderWeeklyInsightEmail } from "../email/weeklyInsightTemplate.js";
import { composeWeeklyInsightsForWorkspace } from "../insights/weeklyInsightComposer.js";

/**
 * Weekly job: for every workspace, compose insights and email every team admin.
 */
export function dispatchWeeklyInsightSummaries(now = new Date()): number {
  let delivered = 0;
  for (const workspaceId of listWorkspaces()) {
    const admins = listTeamAdmins(workspaceId);
    if (admins.length === 0) continue;
    const summary = composeWeeklyInsightsForWorkspace(admins[0].userId, workspaceId, now);
    if (!summary) continue;
    const body = renderWeeklyInsightEmail(summary);
    for (const admin of admins) {
      mailer.send({ ...body, to: [admin.email] });
      delivered += 1;
    }
  }
  return delivered;
}
