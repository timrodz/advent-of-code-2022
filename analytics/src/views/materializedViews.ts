/** Shared materialized-view refresh cadence for dashboard aggregations. */
export const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

export interface MaterializedView<T> {
  name: string;
  refreshedAt: Date | null;
  refresh(): T;
  read(): T;
}

export function createMaterializedView<T>(name: string, compute: () => T): MaterializedView<T> {
  let cache: T | null = null;
  let refreshedAt: Date | null = null;

  const view: MaterializedView<T> = {
    name,
    get refreshedAt() {
      return refreshedAt;
    },
    refresh() {
      cache = compute();
      refreshedAt = new Date();
      return cache;
    },
    read() {
      if (cache === null) {
        return view.refresh();
      }
      return cache;
    },
  };

  return view;
}
