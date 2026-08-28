import { mailer } from "../email/mailer.js";
import { renderScheduledReportEmail } from "../email/scheduledReportEmail.js";
import { nextRunFromCadence } from "../api/reportScheduleApi.js";
import { reportSchedules } from "../repositories/reportScheduleRepository.js";
import { savedReports } from "../repositories/savedReportRepository.js";

export function runDueReportSchedules(now = new Date()): number {
  const due = reportSchedules.listDue(now);
  let sent = 0;
  for (const schedule of due) {
    const report = savedReports.get(schedule.savedReportId);
    if (!report) continue;
    const email = renderScheduledReportEmail(report);
    mailer.send({ ...email, to: schedule.recipientEmails });
    schedule.lastRunAt = now.toISOString();
    schedule.nextRunAt = nextRunFromCadence(schedule.cadence, now);
    reportSchedules.update(schedule);
    sent += 1;
  }
  return sent;
}
