import { createMaterializedView } from "./materializedViews.js";

export type TimeBucket = string;

export interface HeatmapCell {
  memberId: string;
  memberName: string;
  bucket: TimeBucket;
  contributionCount: number;
}

export interface ActiveUserBucket {
  bucket: TimeBucket;
  activeUserCount: number;
}

export interface EngagementHeatmapSnapshot {
  workspaceId: string;
  buckets: TimeBucket[];
  members: Array<{ memberId: string; memberName: string }>;
  cells: HeatmapCell[];
  activeUsers: ActiveUserBucket[];
  refreshedAt: string;
}

interface ContributionEvent {
  workspaceId: string;
  memberId: string;
  memberName: string;
  bucket: TimeBucket;
}

const RAW_EVENTS: ContributionEvent[] = [
  { workspaceId: "ws_demo", memberId: "u_admin", memberName: "Avery Admin", bucket: "Mon" },
  { workspaceId: "ws_demo", memberId: "u_admin", memberName: "Avery Admin", bucket: "Mon" },
  { workspaceId: "ws_demo", memberId: "u_admin", memberName: "Avery Admin", bucket: "Tue" },
  { workspaceId: "ws_demo", memberId: "u_member", memberName: "Morgan Member", bucket: "Mon" },
  { workspaceId: "ws_demo", memberId: "u_member", memberName: "Morgan Member", bucket: "Wed" },
  { workspaceId: "ws_demo", memberId: "u_member", memberName: "Morgan Member", bucket: "Wed" },
  { workspaceId: "ws_demo", memberId: "u_member", memberName: "Morgan Member", bucket: "Wed" },
  { workspaceId: "ws_other", memberId: "u_admin_b", memberName: "Blake Admin", bucket: "Mon" },
];

const BUCKET_ORDER: TimeBucket[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function aggregateWorkspace(workspaceId: string): Omit<EngagementHeatmapSnapshot, "refreshedAt"> {
  const events = RAW_EVENTS.filter((e) => e.workspaceId === workspaceId);
  const memberMap = new Map<string, string>();
  const counts = new Map<string, number>();
  const active = new Map<TimeBucket, Set<string>>();

  for (const event of events) {
    memberMap.set(event.memberId, event.memberName);
    const key = `${event.memberId}|${event.bucket}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!active.has(event.bucket)) active.set(event.bucket, new Set());
    active.get(event.bucket)!.add(event.memberId);
  }

  const members = [...memberMap.entries()].map(([memberId, memberName]) => ({
    memberId,
    memberName,
  }));

  const cells: HeatmapCell[] = [];
  for (const member of members) {
    for (const bucket of BUCKET_ORDER) {
      cells.push({
        memberId: member.memberId,
        memberName: member.memberName,
        bucket,
        contributionCount: counts.get(`${member.memberId}|${bucket}`) ?? 0,
      });
    }
  }

  const activeUsers: ActiveUserBucket[] = BUCKET_ORDER.map((bucket) => ({
    bucket,
    activeUserCount: active.get(bucket)?.size ?? 0,
  }));

  return { workspaceId, buckets: [...BUCKET_ORDER], members, cells, activeUsers };
}

function computeAll(): Map<string, EngagementHeatmapSnapshot> {
  const workspaces = [...new Set(RAW_EVENTS.map((e) => e.workspaceId))];
  const now = new Date().toISOString();
  const map = new Map<string, EngagementHeatmapSnapshot>();
  for (const workspaceId of workspaces) {
    map.set(workspaceId, { ...aggregateWorkspace(workspaceId), refreshedAt: now });
  }
  return map;
}

export const engagementHeatmapView = createMaterializedView(
  "engagement_heatmap_by_workspace",
  computeAll,
);

export function readEngagementHeatmap(workspaceId: string): EngagementHeatmapSnapshot | null {
  const snapshot = engagementHeatmapView.read().get(workspaceId);
  return snapshot ?? null;
}
