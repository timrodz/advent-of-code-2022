import type { ReportSchedule } from "../repositories/reportScheduleRepository.js";
import { handleReportScheduleApi } from "../api/reportScheduleApi.js";

export function renderScheduleManager(token: string, savedReportId: string, schedules: ReportSchedule[]): string {
  const rows = schedules
    .map((s) => {
      return `<tr data-schedule-id="${s.id}">
        <td>${s.cadence}</td>
        <td>${s.status}</td>
        <td>${s.recipientEmails.join(", ")}</td>
        <td>${s.nextRunAt}</td>
        <td>
          <button data-action="pause">Pause</button>
          <button data-action="edit">Edit</button>
          <button data-action="remove">Remove</button>
        </td>
      </tr>`;
    })
    .join("");

  return `<section class="schedule-manager" data-report-id="${savedReportId}">
    <h2>Email schedule</h2>
    <form class="create-schedule">
      <label>Cadence
        <select name="cadence">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </label>
      <label>Recipients <input name="recipientEmails" placeholder="admin@example.com" /></label>
      <button type="submit">Attach schedule</button>
    </form>
    <table>
      <thead><tr><th>Cadence</th><th>Status</th><th>Recipients</th><th>Next run</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}

export function loadScheduleManager(token: string, savedReportId: string): string {
  const res = handleReportScheduleApi(
    "GET",
    `/api/reports/saved/${savedReportId}/schedules`,
    token,
    undefined,
  );
  const schedules = (res.status === 200 ? res.body : []) as ReportSchedule[];
  return renderScheduleManager(token, savedReportId, schedules);
}
