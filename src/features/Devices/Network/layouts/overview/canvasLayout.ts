import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";

export const TILE_WIDTH = 360;
export const TILE_GAP = 16;
export const CANVAS_COLUMNS = 3;

export const GATEWAY_ID = "gateway";
export const GATEWAY_WIDTH = 560;
export const GATEWAY_ESTIMATED_HEIGHT = 260;
/** Vertical room between the gateway and the first row of endpoints, where the connecting edges run. */
export const GATEWAY_EDGE_SPACE = 48;

/** Fewer endpoints than columns would otherwise leave empty columns and push the tiles away from the gateway. */
export function canvasColumns(tileCount: number): number {
  return Math.min(CANVAS_COLUMNS, Math.max(1, tileCount));
}

/** Default spot of the gateway: centered above the endpoint columns. */
export function defaultGatewayPosition(columns = CANVAS_COLUMNS): Position {
  const totalWidth = columns * TILE_WIDTH + (columns - 1) * TILE_GAP;
  return { x: (totalWidth - GATEWAY_WIDTH) / 2, y: 0 };
}

export interface Position {
  x: number;
  y: number;
}

const TILE_CHROME_HEIGHT = 128; // header + footer of a tile
const TILE_ROW_HEIGHT = 80; // one service row
const TILE_EMPTY_BODY_HEIGHT = 44;

/** Rough height of a tile before it has been measured - only used to place new tiles without overlap. */
export function estimateTileHeight(endpoint: Pick<MappedEndpoint, "ports">): number {
  const body = endpoint.ports.length === 0 ? TILE_EMPTY_BODY_HEIGHT : endpoint.ports.length * TILE_ROW_HEIGHT;
  return TILE_CHROME_HEIGHT + body;
}

/**
 * Places every tile without a position in the currently shortest column, below whatever is already
 * placed (and never above `startY`). Tiles that already have a position are never moved.
 */
export function layoutTiles(
  tiles: { id: string; height: number }[],
  known: Record<string, Position>,
  columns = CANVAS_COLUMNS,
  startY = 0,
): Record<string, Position> {
  const heights = tiles.reduce<Record<string, number>>((acc, t) => ({ ...acc, [t.id]: t.height }), {});
  const columnBottoms = Array.from({ length: columns }, () => startY);
  const result: Record<string, Position> = {};

  for (const tile of tiles) {
    const position = known[tile.id];
    if (!position) continue;
    result[tile.id] = position;
    const column = Math.min(columns - 1, Math.max(0, Math.round(position.x / (TILE_WIDTH + TILE_GAP))));
    columnBottoms[column] = Math.max(columnBottoms[column], position.y + heights[tile.id] + TILE_GAP);
  }

  for (const tile of tiles) {
    if (result[tile.id]) continue;
    const column = columnBottoms.indexOf(Math.min(...columnBottoms));
    result[tile.id] = { x: column * (TILE_WIDTH + TILE_GAP), y: columnBottoms[column] };
    columnBottoms[column] += tile.height + TILE_GAP;
  }

  return result;
}

// v2: the gateway now occupies the top of the canvas, so layouts saved before it existed would overlap it.
const STORAGE_PREFIX = "assets-canvas-layout:v2:";

export function loadSavedLayout(deviceId: string): Record<string, Position> {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + deviceId);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Position>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, p]) => Number.isFinite(p?.x) && Number.isFinite(p?.y)),
    );
  } catch {
    return {};
  }
}

export function saveLayout(deviceId: string, layout: Record<string, Position>): void {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + deviceId, JSON.stringify(layout));
  } catch {
    // Storage may be unavailable (private mode / quota) - the layout then simply isn't remembered.
  }
}

export function clearSavedLayout(deviceId: string): void {
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + deviceId);
  } catch {
    // see saveLayout
  }
}

const VIEW_KEY = "assets-view-mode";

export type AssetsViewMode = "list" | "canvas";

export function loadViewMode(): AssetsViewMode {
  try {
    return window.localStorage.getItem(VIEW_KEY) === "canvas" ? "canvas" : "list";
  } catch {
    return "list";
  }
}

export function saveViewMode(mode: AssetsViewMode): void {
  try {
    window.localStorage.setItem(VIEW_KEY, mode);
  } catch {
    // see saveLayout
  }
}
