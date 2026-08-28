import { createMaterializedView } from "../views/materializedViews.js";
import type { ReportDimension, ReportMetric, ReportQueryResult, ReportQuerySpec } from "../reports/contracts.js";

export interface ReportFact {
  workspaceId: string;
  time_period: string;
  team_member: string;
  brief_status: string;
  initiative: string;
  count: number;
  duration: number;
  completed: number;
}

const RAW_FACTS: ReportFact[] = [
  {
    workspaceId: "ws_demo",
    time_period: "2026-W33",
    team_member: "Avery Admin",
    brief_status: "delivering",
    initiative: "Analytics",
    count: 3,
    duration: 40,
    completed: 1,
  },
  {
    workspaceId: "ws_demo",
    time_period: "2026-W33",
    team_member: "Morgan Member",
    brief_status: "aligned",
    initiative: "Analytics",
    count: 2,
    duration: 18,
    completed: 2,
  },
  {
    workspaceId: "ws_demo",
    time_period: "2026-W34",
    team_member: "Avery Admin",
    brief_status: "draft",
    initiative: "Growth",
    count: 1,
    duration: 8,
    completed: 0,
  },
  {
    workspaceId: "ws_other",
    time_period: "2026-W33",
    team_member: "Blake Admin",
    brief_status: "aligned",
    initiative: "Growth",
    count: 4,
    duration: 22,
    completed: 4,
  },
];

function computeFacts(): ReportFact[] {
  return RAW_FACTS.map((f) => ({ ...f }));
}

export const reportFactsView = createMaterializedView("report_facts", computeFacts);

function metricValue(facts: ReportFact[], metric: ReportMetric): number {
  const count = facts.reduce((sum, f) => sum + f.count, 0);
  const duration = facts.reduce((sum, f) => sum + f.duration, 0);
  const completed = facts.reduce((sum, f) => sum + f.completed, 0);
  if (metric === "count") return count;
  if (metric === "duration") return duration;
  return count === 0 ? 0 : Math.round((completed / count) * 100) / 100;
}

function dimensionKey(fact: ReportFact, dimensions: ReportDimension[]): string {
  return dimensions.map((d) => fact[d]).join("|");
}

export function executeReportQuery(spec: ReportQuerySpec): ReportQueryResult {
  let facts = reportFactsView.read().filter((f) => f.workspaceId === spec.workspaceId);
  const filters = spec.filters ?? {};
  if (filters.timePeriod) facts = facts.filter((f) => f.time_period === filters.timePeriod);
  if (filters.teamMemberId) facts = facts.filter((f) => f.team_member === filters.teamMemberId);
  if (filters.briefStatus) facts = facts.filter((f) => f.brief_status === filters.briefStatus);
  if (filters.initiativeId) facts = facts.filter((f) => f.initiative === filters.initiativeId);

  const groups = new Map<string, ReportFact[]>();
  for (const fact of facts) {
    const key = spec.dimensions.length === 0 ? "__all__" : dimensionKey(fact, spec.dimensions);
    const list = groups.get(key) ?? [];
    list.push(fact);
    groups.set(key, list);
  }

  const rows = [...groups.values()].map((group) => {
    const dimensions: ReportQueryResult["rows"][number]["dimensions"] = {};
    const sample = group[0];
    for (const dim of spec.dimensions) {
      dimensions[dim] = sample[dim];
    }
    const metrics: ReportQueryResult["rows"][number]["metrics"] = {};
    for (const metric of spec.metrics) {
      metrics[metric] = metricValue(group, metric);
    }
    return { dimensions, metrics };
  });

  return { spec, rows };
}
