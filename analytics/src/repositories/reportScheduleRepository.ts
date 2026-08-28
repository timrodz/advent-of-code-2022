export type ScheduleCadence = "daily" | "weekly";
export type ScheduleStatus = "active" | "paused";

export interface ReportSchedule {
  id: string;
  savedReportId: string;
  workspaceId: string;
  ownerId: string;
  cadence: ScheduleCadence;
  status: ScheduleStatus;
  recipientEmails: string[];
  nextRunAt: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ReportScheduleNotFoundError extends Error {
  readonly status = 404;
  constructor(id: string) {
    super(`Report schedule ${id} not found`);
    this.name = "ReportScheduleNotFoundError";
  }
}

export interface ReportScheduleRepository {
  create(input: Omit<ReportSchedule, "id" | "createdAt" | "updatedAt" | "lastRunAt"> & { lastRunAt?: string | null }): ReportSchedule;
  update(schedule: ReportSchedule): ReportSchedule;
  get(id: string): ReportSchedule | null;
  listBySavedReport(savedReportId: string): ReportSchedule[];
  listDue(now: Date): ReportSchedule[];
  delete(id: string): void;
}

export function createReportScheduleRepository(): ReportScheduleRepository {
  const store = new Map<string, ReportSchedule>();
  let seq = 0;
  return {
    create(input) {
      seq += 1;
      const now = new Date().toISOString();
      const schedule: ReportSchedule = {
        id: `sch_${seq}`,
        savedReportId: input.savedReportId,
        workspaceId: input.workspaceId,
        ownerId: input.ownerId,
        cadence: input.cadence,
        status: input.status,
        recipientEmails: [...input.recipientEmails],
        nextRunAt: input.nextRunAt,
        lastRunAt: input.lastRunAt ?? null,
        createdAt: now,
        updatedAt: now,
      };
      store.set(schedule.id, schedule);
      return structuredClone(schedule);
    },
    update(schedule) {
      if (!store.has(schedule.id)) throw new ReportScheduleNotFoundError(schedule.id);
      const next = { ...structuredClone(schedule), updatedAt: new Date().toISOString() };
      store.set(next.id, next);
      return structuredClone(next);
    },
    get(id) {
      const found = store.get(id);
      return found ? structuredClone(found) : null;
    },
    listBySavedReport(savedReportId) {
      return [...store.values()]
        .filter((s) => s.savedReportId === savedReportId)
        .map((s) => structuredClone(s));
    },
    listDue(now) {
      return [...store.values()]
        .filter((s) => s.status === "active" && new Date(s.nextRunAt).getTime() <= now.getTime())
        .map((s) => structuredClone(s));
    },
    delete(id) {
      if (!store.has(id)) throw new ReportScheduleNotFoundError(id);
      store.delete(id);
    },
  };
}

export const reportSchedules = createReportScheduleRepository();
