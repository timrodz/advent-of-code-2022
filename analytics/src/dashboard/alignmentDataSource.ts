import type { AlignmentScoreVisualizationModel } from "./alignmentScoreDesign.js";

/**
 * Existing alignment score data source used by the live core dashboard.
 * The visualization component must consume this shape after mapping —
 * it does not fetch.
 */
export interface AlignmentScoreRecord {
  workspaceId: string;
  workspaceAverageScore: number;
  medianTimeToAlignmentHours: number;
  stallCalloutCount: number;
  briefs: Array<{
    briefId: string;
    title: string;
    alignmentScore: number;
    timeToAlignmentHours: number | null;
    status: "aligned" | "diverging" | "in_progress";
    votePatterns: Array<{
      optionId: string;
      optionLabel: string;
      voteCount: number;
      share: number;
    }>;
  }>;
  scoreTrend: Array<{ period: string; score: number }>;
}

const ALIGNMENT_BY_WORKSPACE = new Map<string, AlignmentScoreRecord>([
  [
    "ws_demo",
    {
      workspaceId: "ws_demo",
      workspaceAverageScore: 72,
      medianTimeToAlignmentHours: 18,
      stallCalloutCount: 1,
      briefs: [
        {
          briefId: "br_1",
          title: "Onboarding revamp",
          alignmentScore: 91,
          timeToAlignmentHours: 12,
          status: "aligned",
          votePatterns: [
            { optionId: "go", optionLabel: "Ship", voteCount: 8, share: 0.8 },
            { optionId: "wait", optionLabel: "Wait", voteCount: 2, share: 0.2 },
          ],
        },
        {
          briefId: "br_2",
          title: "Billing export",
          alignmentScore: 48,
          timeToAlignmentHours: null,
          status: "diverging",
          votePatterns: [
            { optionId: "go", optionLabel: "Ship", voteCount: 5, share: 0.5 },
            { optionId: "wait", optionLabel: "Wait", voteCount: 5, share: 0.5 },
          ],
        },
        {
          briefId: "br_3",
          title: "Mobile search",
          alignmentScore: 64,
          timeToAlignmentHours: null,
          status: "in_progress",
          votePatterns: [
            { optionId: "go", optionLabel: "Ship", voteCount: 3, share: 0.6 },
            { optionId: "wait", optionLabel: "Wait", voteCount: 2, share: 0.4 },
          ],
        },
      ],
      scoreTrend: [
        { period: "W-3", score: 61 },
        { period: "W-2", score: 66 },
        { period: "W-1", score: 70 },
        { period: "W", score: 72 },
      ],
    },
  ],
]);

export function getAlignmentScoreRecord(workspaceId: string): AlignmentScoreRecord | null {
  return ALIGNMENT_BY_WORKSPACE.get(workspaceId) ?? null;
}

export function toAlignmentVisualizationModel(
  record: AlignmentScoreRecord,
): AlignmentScoreVisualizationModel {
  return {
    workspaceAverageScore: record.workspaceAverageScore,
    medianTimeToAlignmentHours: record.medianTimeToAlignmentHours,
    stallCalloutCount: record.stallCalloutCount,
    briefs: record.briefs.map((brief) => ({ ...brief })),
    scoreTrend: record.scoreTrend.map((point) => ({ ...point })),
  };
}
