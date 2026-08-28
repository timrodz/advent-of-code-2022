import { describe, expect, it } from "vitest";
import { ALIGNMENT_VIZ_CONTRACT_VERSION } from "./alignmentScoreDesign.js";
import { renderAlignmentScoreVisualization } from "./alignmentScoreVisualization.js";
import {
  getAlignmentScoreRecord,
  toAlignmentVisualizationModel,
} from "./alignmentDataSource.js";
import { renderCoreDashboard } from "./coreDashboard.js";

const sampleModel = {
  workspaceAverageScore: 72,
  medianTimeToAlignmentHours: 18,
  stallCalloutCount: 1,
  scoreTrend: [{ period: "W-1", score: 70 }, { period: "W", score: 72 }],
  briefs: [
    {
      briefId: "br_1",
      title: "Onboarding revamp",
      alignmentScore: 91,
      timeToAlignmentHours: 12,
      status: "aligned" as const,
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
      status: "diverging" as const,
      votePatterns: [
        { optionId: "go", optionLabel: "Ship", voteCount: 5, share: 0.5 },
        { optionId: "wait", optionLabel: "Wait", voteCount: 5, share: 0.5 },
      ],
    },
  ],
};

describe("AlignmentScoreVisualization contract", () => {
  it("freezes the v2 contract version used by the live widget", () => {
    expect(ALIGNMENT_VIZ_CONTRACT_VERSION).toBe("2026-08-alignment-v2");
  });

  it("renders voting patterns and time-to-alignment without fetching", () => {
    const html = renderAlignmentScoreVisualization(sampleModel);
    expect(html).toContain("data-contract=\"2026-08-alignment-v2\"");
    expect(html).toContain("Workspace score");
    expect(html).toContain("72");
    expect(html).toContain("Median time to alignment");
    expect(html).toContain("18h");
    expect(html).toContain("Voting pattern");
    expect(html).toContain("Ship");
    expect(html).toContain("Wait");
    expect(html).toContain("80%");
    expect(html).toContain("12h");
    expect(html).toContain("—");
    expect(html).toContain("Aligned");
    expect(html).toContain("Diverging");
    expect(html).toContain("stalled more than 7 days");
  });

  it("escapes brief titles", () => {
    const html = renderAlignmentScoreVisualization({
      ...sampleModel,
      briefs: [
        {
          ...sampleModel.briefs[0],
          title: "<script>alert(1)</script>",
        },
      ],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("live dashboard swap", () => {
  it("wires the existing alignment data source into the refined visualization", () => {
    const record = getAlignmentScoreRecord("ws_demo");
    expect(record).not.toBeNull();
    const html = renderCoreDashboard("ws_demo");
    expect(html).toContain("alignment-score-visualization");
    expect(html).toContain("data-contract=\"2026-08-alignment-v2\"");
    expect(html).toContain("Onboarding revamp");
    expect(html).toContain("Brief lifecycle");
    expect(html).toContain("Team velocity");
    const model = toAlignmentVisualizationModel(record!);
    expect(model.workspaceAverageScore).toBe(record!.workspaceAverageScore);
  });
});
