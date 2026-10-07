import type { JsonValue } from '../../lib/json';

export const JSON_SAMPLE = JSON.stringify(
  {
    project: 'Web Tools Box',
    localOnly: true,
    tools: [
      { name: 'JSON Visualizer', ready: true },
      { name: 'Markdown Preview', ready: true },
    ],
    version: 1,
    note: null,
  },
  null,
  2,
);
export type JsonRow = {
  path: string;
  parent: string | null;
  key: string;
  depth: number;
  branch: boolean;
  summary: string;
};

export function jsonRows(value: JsonValue): JsonRow[] {
  const rows: JsonRow[] = [];
  function walk(value: JsonValue, path: string, parent: string | null, key: string, depth: number) {
    const branch = value !== null && typeof value === 'object';
    const count = branch ? Object.keys(value).length : 0;
    rows.push({
      path,
      parent,
      key,
      depth,
      branch: branch && count > 0,
      summary: branch
        ? `${Array.isArray(value) ? '配列' : 'オブジェクト'} · ${count} 項目`
        : JSON.stringify(value),
    });
    if (branch)
      for (const [key, child] of Object.entries(value)) {
        const next = Array.isArray(value) ? `${path}[${key}]` : `${path}[${JSON.stringify(key)}]`;
        walk(child, next, path, key, depth + 1);
      }
  }
  walk(value, '$', null, '$', 0);
  return rows;
}

export function filterRows(rows: JsonRow[], search: string, collapsed: Set<string>) {
  const query = search.trim().toLocaleLowerCase();
  if (query) {
    const included = new Set<string>();
    const parents = new Map(rows.map((row) => [row.path, row.parent]));
    let matches = 0;
    for (const row of rows)
      if (row.key.toLocaleLowerCase().includes(query)) {
        matches++;
        let path: string | null = row.path;
        while (path !== null && !included.has(path)) {
          included.add(path);
          path = parents.get(path) ?? null;
        }
      }
    return { rows: rows.filter((row) => included.has(row.path)), matches };
  }
  const hidden = new Set<string>();
  return {
    rows: rows.filter((row) => {
      if (row.parent && (hidden.has(row.parent) || collapsed.has(row.parent))) {
        hidden.add(row.path);
        return false;
      }
      return true;
    }),
    matches: 0,
  };
}
