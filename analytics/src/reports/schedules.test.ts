import { describe, expect, it } from "vitest";
import { createLayoutBuilder, dropOntoCanvas } from "../reports/layoutBuilder.js";
import { saveReportFromBuilder } from "../reports/savedReportsUi.js";
import { handleReportScheduleApi } from "../api/reportScheduleApi.js";
import { runDueReportSchedules } from "../jobs/reportScheduleRunner.js";
import { mailer } from "../email/mailer.js";
import { loadScheduleManager } from "../reports/scheduleUi.js";
import type { ReportSchedule } from "../repositories/reportScheduleRepository.js";

function layout() {
  let state = createLayoutBuilder();
  state = dropOntoCanvas(state, "initiative", "rows");
  state = dropOntoCanvas(state, "count", "metrics");
  return state.layout;
}

describe("ReportSchedule CRUD", () => {
  it("attaches a recurring schedule to a saved report", () => {
    const saved = saveReportFromBuilder("u_admin", "Schedulable", layout());
    const created = handleReportScheduleApi(
      "POST",
      `/api/reports/saved/${saved.id}/schedules`,
      "u_admin",
      {
        cadence: "weekly",
        recipientEmails: ["ops@example.com"],
        nextRunAt: new Date(Date.now() - 1000).toISOString(),
      },
    );
    expect(created.status).toBe(201);
    const id = (created.body as ReportSchedule).id;
    const listed = handleReportScheduleApi(
      "GET",
      `/api/reports/saved/${saved.id}/schedules`,
      "u_admin",
      undefined,
    );
    expect((listed.body as ReportSchedule[]).some((s) => s.id === id)).toBe(true);
    const paused = handleReportScheduleApi("PATCH", `/api/reports/schedules/${id}`, "u_admin", {
      status: "paused",
    });
    expect((paused.body as ReportSchedule).status).toBe("paused");
    const deleted = handleReportScheduleApi(
      "DELETE",
      `/api/reports/schedules/${id}`,
      "u_admin",
      undefined,
    );
    expect(deleted.status).toBe(204);
  });
});

describe("due schedule runner", () => {
  it("emails rendered reports and advances next_run_at", () => {
    mailer.sent.length = 0;
    const saved = saveReportFromBuilder("u_admin", "Inbox velocity", layout());
    const created = handleReportScheduleApi(
      "POST",
      `/api/reports/saved/${saved.id}/schedules`,
      "u_admin",
      {
        cadence: "daily",
        recipientEmails: ["ops@example.com"],
        nextRunAt: new Date(Date.now() - 60_000).toISOString(),
      },
    );
    const schedule = created.body as ReportSchedule;
    const sent = runDueReportSchedules(new Date());
    expect(sent).toBeGreaterThanOrEqual(1);
    expect(mailer.sent.some((e) => e.to.includes("ops@example.com"))).toBe(true);
    expect(mailer.sent.some((e) => e.subject.includes("Inbox velocity"))).toBe(true);
    const after = handleReportScheduleApi(
      "GET",
      `/api/reports/saved/${saved.id}/schedules`,
      "u_admin",
      undefined,
    );
    const updated = (after.body as ReportSchedule[]).find((s) => s.id === schedule.id)!;
    expect(new Date(updated.nextRunAt).getTime()).toBeGreaterThan(Date.now() - 1000);
    expect(updated.lastRunAt).not.toBeNull();
  });
});

describe("schedule management UI", () => {
  it("renders attach, pause, edit, and remove controls for a saved report", () => {
    const saved = saveReportFromBuilder("u_admin", "UI scheduled", layout());
    handleReportScheduleApi("POST", `/api/reports/saved/${saved.id}/schedules`, "u_admin", {
      cadence: "weekly",
      recipientEmails: ["admin@example.com"],
      nextRunAt: new Date().toISOString(),
    });
    const html = loadScheduleManager("u_admin", saved.id);
    expect(html).toContain("schedule-manager");
    expect(html).toContain("Attach schedule");
    expect(html).toContain("Pause");
    expect(html).toContain("Edit");
    expect(html).toContain("Remove");
    expect(html).toContain("admin@example.com");
  });
});
