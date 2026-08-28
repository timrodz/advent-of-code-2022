import http from "node:http";
import { handleDashboardApi } from "./api/dashboardApi.js";
import { handleReportQueryApi } from "./api/reportQueryApi.js";
import { handleSavedReportApi } from "./api/savedReportApi.js";
import { handleReportScheduleApi } from "./api/reportScheduleApi.js";
import { renderCoreDashboard } from "./dashboard/coreDashboard.js";
import { runDueReportSchedules } from "./jobs/reportScheduleRunner.js";
import { dispatchWeeklyInsightSummaries } from "./jobs/weeklyInsightDispatcher.js";

function tokenFrom(req: http.IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length);
}

async function readBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return undefined;
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const method = req.method ?? "GET";
    const token = tokenFrom(req);

    if (url.pathname === "/" && method === "GET") {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(renderCoreDashboard("ws_demo"));
      return;
    }

    if (url.pathname === "/jobs/run-due-schedules" && method === "POST") {
      const sent = runDueReportSchedules();
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ sent }));
      return;
    }

    if (url.pathname === "/jobs/weekly-insights" && method === "POST") {
      const delivered = dispatchWeeklyInsightSummaries();
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ delivered }));
      return;
    }

    let result;
    if (url.pathname.startsWith("/api/dashboard/")) {
      result = handleDashboardApi(method, url.pathname, token);
    } else if (url.pathname === "/api/reports/query") {
      result = handleReportQueryApi(method, url.pathname, token, await readBody(req));
    } else if (url.pathname.includes("/schedules") || url.pathname.startsWith("/api/reports/schedules/")) {
      result = handleReportScheduleApi(method, url.pathname, token, await readBody(req));
    } else if (url.pathname.startsWith("/api/reports/saved")) {
      result = handleSavedReportApi(method, url.pathname, token, await readBody(req));
    } else {
      result = { status: 404, body: { error: "Not found" } };
    }

    res.statusCode = result.status;
    if (result.body === null) {
      res.end();
      return;
    }
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(result.body));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, () => {
    console.log(`analytics dashboard listening on ${port}`);
  });
}
