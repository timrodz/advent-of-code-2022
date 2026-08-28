import {
  emptyLayout,
  REPORT_DIMENSIONS,
  REPORT_METRICS,
  type LayoutZone,
  type ReportDimension,
  type ReportLayout,
  type ReportMetric,
} from "./contracts.js";

export interface SelectionState {
  dimensions: ReportDimension[];
  metrics: ReportMetric[];
}

export interface LayoutBuilderState {
  selection: SelectionState;
  layout: ReportLayout;
}

const DEFAULT_SELECTION: SelectionState = {
  dimensions: [...REPORT_DIMENSIONS],
  metrics: [...REPORT_METRICS],
};

export function createLayoutBuilder(
  selection: SelectionState = DEFAULT_SELECTION,
): LayoutBuilderState {
  return { selection, layout: emptyLayout() };
}

function isDimension(value: string): value is ReportDimension {
  return (REPORT_DIMENSIONS as readonly string[]).includes(value);
}

function isMetric(value: string): value is ReportMetric {
  return (REPORT_METRICS as readonly string[]).includes(value);
}

/**
 * Drop a selected field onto a canvas zone. Dimensions may land in rows or
 * columns; metrics only in the metric list. Emits an updated ReportLayout.
 */
export function dropOntoCanvas(
  state: LayoutBuilderState,
  field: string,
  zone: LayoutZone,
): LayoutBuilderState {
  const layout: ReportLayout = {
    rows: state.layout.rows.filter((d) => d !== field),
    columns: state.layout.columns.filter((d) => d !== field),
    metrics: state.layout.metrics.filter((m) => m !== field),
  };

  if (zone === "metrics") {
    if (!isMetric(field) || !state.selection.metrics.includes(field)) {
      return state;
    }
    if (!layout.metrics.includes(field)) layout.metrics = [...layout.metrics, field];
    return { ...state, layout };
  }

  if (!isDimension(field) || !state.selection.dimensions.includes(field)) {
    return state;
  }
  if (zone === "rows" && !layout.rows.includes(field)) {
    layout.rows = [...layout.rows, field];
  }
  if (zone === "columns" && !layout.columns.includes(field)) {
    layout.columns = [...layout.columns, field];
  }
  return { ...state, layout };
}

export function renderLayoutBuilderCanvas(state: LayoutBuilderState): string {
  const paletteDims = state.selection.dimensions
    .map((d) => `<li draggable="true" data-field="${d}" data-kind="dimension">${d}</li>`)
    .join("");
  const paletteMetrics = state.selection.metrics
    .map((m) => `<li draggable="true" data-field="${m}" data-kind="metric">${m}</li>`)
    .join("");
  const zone = (name: LayoutZone, items: string[]) =>
    `<div class="drop-zone" data-zone="${name}"><h3>${name}</h3><ul>${items
      .map((item) => `<li data-placed="${item}">${item}</li>`)
      .join("")}</ul></div>`;

  return `<section class="report-layout-builder" data-testid="layout-canvas">
    <aside class="selection-palette">
      <h2>Dimensions</h2><ul class="palette-dimensions">${paletteDims}</ul>
      <h2>Metrics</h2><ul class="palette-metrics">${paletteMetrics}</ul>
    </aside>
    <div class="canvas">
      ${zone("rows", state.layout.rows)}
      ${zone("columns", state.layout.columns)}
      ${zone("metrics", state.layout.metrics)}
    </div>
  </section>`;
}
