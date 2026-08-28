export interface WeeklyInsightSummary {
  workspaceId: string;
  weekStart: string;
  weekEnd: string;
  lifecycle: {
    bottleneckStatus: string;
    averageHoursByStatus: Record<string, number>;
  };
  velocity: {
    briefsCompletedPerSprint: number;
    taskThroughput: number;
  };
  alignment: {
    workspaceAverageScore: number;
    medianTimeToAlignmentHours: number;
    stallCalloutCount: number;
  };
  engagement: {
    totalContributions: number;
    peakActiveUsers: number;
    peakBucket: string | null;
  };
}

export function composeWeeklyInsightSummary(
  workspaceId: string,
  weekStart: string,
  weekEnd: string,
  sources: {
    lifecycle: WeeklyInsightSummary["lifecycle"];
    velocity: WeeklyInsightSummary["velocity"];
    alignment: WeeklyInsightSummary["alignment"];
    engagement: { totalContributions: number; peakActiveUsers: number; peakBucket: string | null };
  },
): WeeklyInsightSummary {
  return {
    workspaceId,
    weekStart,
    weekEnd,
    lifecycle: sources.lifecycle,
    velocity: sources.velocity,
    alignment: sources.alignment,
    engagement: sources.engagement,
  };
}
