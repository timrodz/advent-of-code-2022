/**
 * Alignment score visualization — design source of truth (HAM-77)
 *
 * Synthesized from early-user feedback on the shipped single-gauge widget:
 *
 * 1. A lone 0–100 gauge hid whether alignment was consensus or a 51/49 split.
 *    Redesign: always pair the score with a vote-pattern breakdown.
 * 2. Time-to-alignment was buried in a tooltip. Admins could not scan stalls.
 *    Redesign: median hours plus a compact distribution, with stall callouts.
 * 3. Period-over-period movement was missing, so “are we getting better?”
 *    required a spreadsheet. Redesign: a short score trend series.
 * 4. Red/amber/green on people-shaped data felt like surveillance.
 *    Redesign: sequential blue intensity for magnitude; status chips use
 *    aligned / diverging / in-progress language, never “failing people”.
 * 5. Unaligned briefs looked like errors. Redesign: in-progress is a valid
 *    state; only “diverging” (split votes past the expected window) is flagged.
 *
 * Frozen component contract consumed by AlignmentScoreVisualization:
 * the component is presentation-only and must not fetch or reshape data.
 */

export type AlignmentStatus = "aligned" | "diverging" | "in_progress";

export interface VotePattern {
  optionId: string;
  optionLabel: string;
  voteCount: number;
  /** Share of votes for this option, 0–1 inclusive. */
  share: number;
}

export interface AlignmentBriefRow {
  briefId: string;
  title: string;
  alignmentScore: number;
  /** Null when the brief has not yet reached aligned status. */
  timeToAlignmentHours: number | null;
  votePatterns: VotePattern[];
  status: AlignmentStatus;
}

export interface AlignmentTrendPoint {
  period: string;
  score: number;
}

export interface AlignmentScoreVisualizationModel {
  workspaceAverageScore: number;
  medianTimeToAlignmentHours: number;
  stallCalloutCount: number;
  briefs: AlignmentBriefRow[];
  scoreTrend: AlignmentTrendPoint[];
}

export const ALIGNMENT_VIZ_CONTRACT_VERSION = "2026-08-alignment-v2" as const;
