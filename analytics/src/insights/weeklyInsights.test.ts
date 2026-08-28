import { describe, expect, it } from "vitest";
import { composeWeeklyInsightsForWorkspace } from "./weeklyInsightComposer.js";
import { renderWeeklyInsightEmail } from "../email/weeklyInsightTemplate.js";
import { dispatchWeeklyInsightSummaries } from "../jobs/weeklyInsightDispatcher.js";
import { mailer } from "../email/mailer.js";
import { listTeamAdmins } from "../auth/teamAdmin.js";

describe("weekly insight composer", () => {
  it("assembles a payload from lifecycle, velocity, alignment, and engagement", () => {
    const summary = composeWeeklyInsightsForWorkspace("u_admin", "ws_demo");
    expect(summary).not.toBeNull();
    expect(summary!.lifecycle.bottleneckStatus).toBe("delivering");
    expect(summary!.velocity.taskThroughput).toBe(28);
    expect(summary!.alignment.workspaceAverageScore).toBe(72);
    expect(summary!.engagement.totalContributions).toBeGreaterThan(0);
    expect(summary!.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("weekly insight email template", () => {
  it("renders HTML and plain-text bodies from the composer payload", () => {
    const summary = composeWeeklyInsightsForWorkspace("u_admin", "ws_demo")!;
    const email = renderWeeklyInsightEmail(summary);
    expect(email.html).toContain("weekly-insight-summary");
    expect(email.html).toContain("Lifecycle");
    expect(email.html).toContain("Velocity");
    expect(email.html).toContain("Alignment");
    expect(email.html).toContain("Engagement");
    expect(email.text).toContain("Alignment score 72");
    expect(email.subject).toContain("Weekly insights");
  });
});

describe("weekly insight dispatcher", () => {
  it("emails every team admin via the transactional mailer", () => {
    mailer.sent.length = 0;
    const delivered = dispatchWeeklyInsightSummaries();
    const admins = listTeamAdmins();
    expect(delivered).toBe(admins.length);
    for (const admin of admins) {
      expect(mailer.sent.some((e) => e.to.includes(admin.email))).toBe(true);
    }
  });
});
