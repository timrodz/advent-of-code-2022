import { describe, expect, it } from "vitest";
import { createSavedReportRepository } from "../repositories/savedReportRepository.js";
import { handleSavedReportApi } from "../api/savedReportApi.js";
import { createLayoutBuilder, dropOntoCanvas } from "./layoutBuilder.js";
import {
  listSavedReports,
  reopenSavedReport,
  renderSavedReportsUi,
  saveReportFromBuilder,
} from "./savedReportsUi.js";

function builtLayout() {
  let state = createLayoutBuilder();
  state = dropOntoCanvas(state, "initiative", "rows");
  state = dropOntoCanvas(state, "count", "metrics");
  return state.layout;
}

describe("SavedReport repository", () => {
  it("persists owner, workspace, name, and layout configuration", () => {
    const repo = createSavedReportRepository();
    const created = repo.create({
      workspaceId: "ws_demo",
      ownerId: "u_admin",
      name: "Velocity by initiative",
      layout: builtLayout(),
      querySpec: {
        workspaceId: "ws_demo",
        dimensions: ["initiative"],
        metrics: ["count"],
      },
    });
    expect(created.id).toMatch(/^sr_/);
    expect(repo.get(created.id)?.name).toBe("Velocity by initiative");
    expect(repo.listByOwner("ws_demo", "u_admin")).toHaveLength(1);
  });
});

describe("save, list, and reopen", () => {
  it("lets a team admin name, list, and rehydrate a report in the builder", () => {
    const layout = builtLayout();
    const saved = saveReportFromBuilder("u_admin", "Weekly velocity", layout);
    expect(saved.name).toBe("Weekly velocity");
    const listed = listSavedReports("u_admin");
    expect(listed.mine.some((r) => r.id === saved.id)).toBe(true);
    const reopened = reopenSavedReport("u_admin", saved.id);
    expect(reopened.readOnly).toBe(false);
    expect(reopened.state.layout).toEqual(layout);
    const html = renderSavedReportsUi("u_admin", "ws_demo", {
      state: reopened.state,
      readOnly: false,
    });
    expect(html).toContain("Weekly velocity");
    expect(html).toContain('data-mode="editable"');
  });
});

describe("share saved reports", () => {
  it("lets the owner share a report that recipients open read-only", () => {
    const layout = builtLayout();
    const saved = saveReportFromBuilder("u_admin", "Shared velocity", layout);
    const share = handleSavedReportApi("POST", `/api/reports/saved/${saved.id}/share`, "u_admin", {
      memberIds: ["u_peer"],
    });
    expect(share.status).toBe(200);

    const otherWorkspace = listSavedReports("u_admin_b");
    expect(otherWorkspace.sharedWithMe).toEqual([]);

    const asPeer = listSavedReports("u_peer");
    expect(asPeer.sharedWithMe.some((r) => r.id === saved.id)).toBe(true);

    const opened = reopenSavedReport("u_peer", saved.id);
    expect(opened.readOnly).toBe(true);
    expect(opened.state.layout).toEqual(layout);

    const html = renderSavedReportsUi("u_peer", "ws_demo", {
      state: opened.state,
      readOnly: true,
    });
    expect(html).toContain("Shared velocity (shared)");
    expect(html).toContain('data-mode="read-only"');

    const memberDenied = handleSavedReportApi(
      "GET",
      `/api/reports/saved/${saved.id}`,
      "u_member",
      undefined,
    );
    expect(memberDenied.status).toBe(403);

    handleSavedReportApi("POST", `/api/reports/saved/${saved.id}/share`, "u_admin", {
      memberIds: ["u_peer", "u_member"],
    });
    const memberView = handleSavedReportApi(
      "GET",
      `/api/reports/saved/${saved.id}`,
      "u_member",
      undefined,
    );
    expect(memberView.status).toBe(200);
    expect((memberView.body as { readOnly: boolean }).readOnly).toBe(true);
    const memberList = listSavedReports("u_member");
    expect(memberList.sharedWithMe.some((r) => r.id === saved.id)).toBe(true);
  });
});
