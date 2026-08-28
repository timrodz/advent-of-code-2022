import type { ReportLayout, ReportQuerySpec } from "../reports/contracts.js";

export interface SavedReport {
  id: string;
  workspaceId: string;
  ownerId: string;
  name: string;
  layout: ReportLayout;
  querySpec: ReportQuerySpec;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export class SavedReportNotFoundError extends Error {
  readonly status = 404;
  constructor(id: string) {
    super(`Saved report ${id} not found`);
    this.name = "SavedReportNotFoundError";
  }
}

export class SavedReportForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "Not allowed") {
    super(message);
    this.name = "SavedReportForbiddenError";
  }
}

export interface SavedReportRepository {
  create(input: Omit<SavedReport, "id" | "createdAt" | "updatedAt" | "sharedWith"> & { sharedWith?: string[] }): SavedReport;
  update(report: SavedReport): SavedReport;
  get(id: string): SavedReport | null;
  listByOwner(workspaceId: string, ownerId: string): SavedReport[];
  listSharedWith(workspaceId: string, userId: string): SavedReport[];
}

export function createSavedReportRepository(): SavedReportRepository {
  const store = new Map<string, SavedReport>();
  let seq = 0;

  return {
    create(input) {
      seq += 1;
      const now = new Date().toISOString();
      const report: SavedReport = {
        id: `sr_${seq}`,
        workspaceId: input.workspaceId,
        ownerId: input.ownerId,
        name: input.name,
        layout: structuredClone(input.layout),
        querySpec: structuredClone(input.querySpec),
        sharedWith: [...(input.sharedWith ?? [])],
        createdAt: now,
        updatedAt: now,
      };
      store.set(report.id, report);
      return structuredClone(report);
    },
    update(report) {
      const existing = store.get(report.id);
      if (!existing) throw new SavedReportNotFoundError(report.id);
      const next: SavedReport = {
        ...structuredClone(report),
        updatedAt: new Date().toISOString(),
      };
      store.set(next.id, next);
      return structuredClone(next);
    },
    get(id) {
      const found = store.get(id);
      return found ? structuredClone(found) : null;
    },
    listByOwner(workspaceId, ownerId) {
      return [...store.values()]
        .filter((r) => r.workspaceId === workspaceId && r.ownerId === ownerId)
        .map((r) => structuredClone(r));
    },
    listSharedWith(workspaceId, userId) {
      return [...store.values()]
        .filter(
          (r) =>
            r.workspaceId === workspaceId &&
            r.ownerId !== userId &&
            r.sharedWith.includes(userId),
        )
        .map((r) => structuredClone(r));
    },
  };
}

export const savedReports = createSavedReportRepository();
