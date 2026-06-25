export interface Vec2 { x: number; y: number; }

export interface MapDef {
  cols: number;
  rows: number;
  tileSize: number;
  waypoints: Vec2[];
  paths?: Vec2[][];
  buildable: boolean[][];
}

function markPathOnGrid(buildable: boolean[][], waypoints: Vec2[]) {
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
}

function createEmptyGrid(rows: number, cols: number): boolean[][] {
  const buildable: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    buildable[r] = [];
    for (let c = 0; c < cols; c++) {
      buildable[r][c] = true;
    }
  }
  return buildable;
}

export function createMap1_1(): MapDef {
  const cols = 16;
  const rows = 10;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 6, y: 2 },
    { x: 6, y: 7 },
    { x: 15, y: 7 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable };
}

export function createMap1_2(): MapDef {
  const cols = 16;
  const rows = 10;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 5 },
    { x: 10, y: 5 },
    { x: 10, y: 8 },
    { x: 15, y: 8 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable };
}

export function createMap1_3(): MapDef {
  const cols = 16;
  const rows = 10;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 3 },
    { x: 9, y: 3 },
    { x: 9, y: 5 },
    { x: 15, y: 5 },
  ];

  const pathB: Vec2[] = [
    { x: 0, y: 8 },
    { x: 4, y: 8 },
    { x: 4, y: 7 },
    { x: 9, y: 7 },
    { x: 9, y: 5 },
    { x: 15, y: 5 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB],
    buildable,
  };
}

export function createMap1_B(): MapDef {
  const cols = 16;
  const rows = 10;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 3, y: 2 },
    { x: 3, y: 7 },
    { x: 7, y: 7 },
    { x: 7, y: 1 },
    { x: 12, y: 1 },
    { x: 12, y: 8 },
    { x: 15, y: 8 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable };
}
