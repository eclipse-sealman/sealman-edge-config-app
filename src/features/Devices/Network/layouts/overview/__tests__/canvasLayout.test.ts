import { describe, expect, it } from "vitest";
import { CANVAS_COLUMNS, GATEWAY_WIDTH, TILE_GAP, TILE_WIDTH, defaultGatewayPosition, estimateTileHeight, layoutTiles } from "../canvasLayout";

const COLUMN = TILE_WIDTH + TILE_GAP;

describe("layoutTiles", () => {
  it("fills the columns left to right, then stacks below the shortest column", () => {
    const layout = layoutTiles(
      [
        { id: "a", height: 100 },
        { id: "b", height: 300 },
        { id: "c", height: 100 },
        { id: "d", height: 100 },
      ],
      {},
    );
    expect(layout.a).toEqual({ x: 0, y: 0 });
    expect(layout.b).toEqual({ x: COLUMN, y: 0 });
    expect(layout.c).toEqual({ x: 2 * COLUMN, y: 0 });
    // column 0 and 2 are equally short, the first one wins
    expect(layout.d).toEqual({ x: 0, y: 100 + TILE_GAP });
  });

  it("never moves tiles that already have a position and places new ones around them", () => {
    const layout = layoutTiles(
      [
        { id: "placed", height: 200 },
        { id: "new", height: 100 },
      ],
      { placed: { x: 0, y: 500 } },
    );
    expect(layout.placed).toEqual({ x: 0, y: 500 });
    // columns 1 and 2 are empty, so the new tile does not end up below the placed one
    expect(layout.new).toEqual({ x: COLUMN, y: 0 });
  });

  it("returns a position for every tile", () => {
    const tiles = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, height: 150 }));
    expect(Object.keys(layoutTiles(tiles, {}))).toHaveLength(10);
  });
});

describe("gateway layout", () => {
  it("starts auto-placed tiles below the given start offset", () => {
    const layout = layoutTiles([{ id: "a", height: 100 }], {}, CANVAS_COLUMNS, 340);
    expect(layout.a).toEqual({ x: 0, y: 340 });
  });

  it("centers the gateway above the endpoint columns", () => {
    const { x, y } = defaultGatewayPosition();
    const totalWidth = CANVAS_COLUMNS * TILE_WIDTH + (CANVAS_COLUMNS - 1) * TILE_GAP;
    expect(y).toBe(0);
    expect(x + GATEWAY_WIDTH / 2).toBe(totalWidth / 2);
  });
});

describe("estimateTileHeight", () => {
  it("grows with the number of services", () => {
    const none = estimateTileHeight({ ports: [] });
    const some = estimateTileHeight({ ports: new Array(3).fill({ status: "online", source: "configured" }) });
    expect(some).toBeGreaterThan(none);
  });
});
