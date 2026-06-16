export interface Vec2 { x: number; y: number; }

export interface MapDef {
  cols: number;
  rows: number;
  tileSize: number;
  waypoints: Vec2[];
  buildable: boolean[][];
}

export function createMap1_1(): MapDef {
  const cols = 16;
  const rows = 10;
  const tileSize = 1;

  const buildable: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    buildable[r] = [];
    for (let c = 0; c < cols; c++) {
      buildable[r][c] = true;
    }
  }

  // S-curve path waypoints (tile center coords)
  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 6, y: 2 },
    { x: 6, y: 7 },
    { x: 15, y: 7 },
  ];

  // Mark path tiles as non-buildable
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (a.y === b.y) {
      const minX = Math.min(a.x, b.x);
      const maxX = Math.max(a.x, b.x);
      for (let x = minX; x <= maxX; x++) {
        buildable[a.y][x] = false;
      }
    } else {
      const minY = Math.min(a.y, b.y);
      const maxY = Math.max(a.y, b.y);
      for (let y = minY; y <= maxY; y++) {
        buildable[y][a.x] = false;
      }
    }
  }

  return { cols, rows, tileSize, waypoints, buildable };
}
