export interface Vec2 { x: number; y: number; }

export interface MapDef {
  cols: number;
  rows: number;
  tileSize: number;
  waypoints: Vec2[];
  paths?: Vec2[][];
  buildable: boolean[][];
  cameraDistance?: number;
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

export function createMap2_1(): MapDef {
  const cols = 18;
  const rows = 12;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 5, y: 2 },
    { x: 5, y: 9 },
    { x: 12, y: 9 },
    { x: 12, y: 4 },
    { x: 17, y: 4 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 20 };
}

export function createMap2_2(): MapDef {
  const cols = 18;
  const rows = 12;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 5 },
    { x: 4, y: 5 },
    { x: 4, y: 3 },
    { x: 13, y: 3 },
    { x: 13, y: 8 },
    { x: 17, y: 8 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 20 };
}

export function createMap2_3(): MapDef {
  const cols = 18;
  const rows = 12;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 1 },
    { x: 3, y: 1 },
    { x: 3, y: 5 },
    { x: 7, y: 5 },
    { x: 7, y: 2 },
    { x: 11, y: 2 },
    { x: 11, y: 7 },
    { x: 14, y: 7 },
    { x: 14, y: 10 },
    { x: 17, y: 10 },
  ];

  markPathOnGrid(buildable, waypoints);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (buildable[r][c] && (c < 1 || c > 16 || r < 0 || r > 11)) {
        buildable[r][c] = false;
      }
    }
  }
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 20 };
}

export function createMap2_B(): MapDef {
  const cols = 18;
  const rows = 12;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 5 },
    { x: 8, y: 5 },
    { x: 8, y: 6 },
    { x: 13, y: 6 },
    { x: 13, y: 2 },
    { x: 17, y: 2 },
  ];

  const pathB: Vec2[] = [
    { x: 0, y: 9 },
    { x: 4, y: 9 },
    { x: 4, y: 6 },
    { x: 8, y: 6 },
    { x: 8, y: 5 },
    { x: 13, y: 5 },
    { x: 13, y: 9 },
    { x: 17, y: 9 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB],
    buildable,
    cameraDistance: 20,
  };
}

export function createMap3_1(): MapDef {
  const cols = 20;
  const rows = 14;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 5, y: 2 },
    { x: 5, y: 7 },
    { x: 10, y: 7 },
    { x: 10, y: 3 },
    { x: 15, y: 3 },
    { x: 15, y: 11 },
    { x: 19, y: 11 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 22 };
}

export function createMap3_2(): MapDef {
  const cols = 20;
  const rows = 14;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 3 },
    { x: 6, y: 3 },
    { x: 6, y: 6 },
    { x: 13, y: 6 },
    { x: 13, y: 3 },
    { x: 19, y: 3 },
  ];

  const pathB: Vec2[] = [
    { x: 0, y: 10 },
    { x: 6, y: 10 },
    { x: 6, y: 8 },
    { x: 13, y: 8 },
    { x: 13, y: 10 },
    { x: 19, y: 10 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB],
    buildable,
    cameraDistance: 22,
  };
}

export function createMap3_3(): MapDef {
  const cols = 20;
  const rows = 14;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 1 },
    { x: 5, y: 1 },
    { x: 5, y: 4 },
    { x: 12, y: 4 },
    { x: 12, y: 7 },
    { x: 19, y: 7 },
  ];

  const pathB: Vec2[] = [
    { x: 0, y: 7 },
    { x: 3, y: 7 },
    { x: 3, y: 9 },
    { x: 9, y: 9 },
    { x: 9, y: 7 },
    { x: 19, y: 7 },
  ];

  const pathC: Vec2[] = [
    { x: 0, y: 12 },
    { x: 5, y: 12 },
    { x: 5, y: 10 },
    { x: 12, y: 10 },
    { x: 12, y: 7 },
    { x: 19, y: 7 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);
  markPathOnGrid(buildable, pathC);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB, pathC],
    buildable,
    cameraDistance: 22,
  };
}

export function createMap3_B(): MapDef {
  const cols = 20;
  const rows = 14;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 3, y: 2 },
    { x: 3, y: 8 },
    { x: 7, y: 8 },
    { x: 7, y: 1 },
    { x: 12, y: 1 },
    { x: 12, y: 11 },
    { x: 16, y: 11 },
    { x: 16, y: 5 },
    { x: 19, y: 5 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 22 };
}

export function createMap4_1(): MapDef {
  const cols = 22;
  const rows = 16;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 2 },
    { x: 5, y: 2 },
    { x: 5, y: 7 },
    { x: 2, y: 7 },
    { x: 2, y: 12 },
    { x: 9, y: 12 },
    { x: 9, y: 4 },
    { x: 14, y: 4 },
    { x: 14, y: 13 },
    { x: 19, y: 13 },
    { x: 19, y: 8 },
    { x: 21, y: 8 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 26 };
}

export function createMap4_2(): MapDef {
  const cols = 22;
  const rows = 16;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 2 },
    { x: 6, y: 2 },
    { x: 6, y: 7 },
    { x: 10, y: 7 },
    { x: 10, y: 10 },
    { x: 16, y: 10 },
    { x: 16, y: 14 },
    { x: 21, y: 14 },
  ];

  const pathB: Vec2[] = [
    { x: 0, y: 8 },
    { x: 4, y: 8 },
    { x: 4, y: 12 },
    { x: 10, y: 12 },
    { x: 10, y: 10 },
    { x: 16, y: 10 },
    { x: 16, y: 14 },
    { x: 21, y: 14 },
  ];

  const pathC: Vec2[] = [
    { x: 0, y: 14 },
    { x: 6, y: 14 },
    { x: 6, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 10 },
    { x: 16, y: 10 },
    { x: 16, y: 14 },
    { x: 21, y: 14 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);
  markPathOnGrid(buildable, pathC);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB, pathC],
    buildable,
    cameraDistance: 26,
  };
}

export function createMap4_3(): MapDef {
  const cols = 22;
  const rows = 16;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 3 },
    { x: 6, y: 3 },
    { x: 6, y: 10 },
    { x: 12, y: 10 },
    { x: 12, y: 5 },
    { x: 18, y: 5 },
    { x: 18, y: 12 },
    { x: 21, y: 12 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 26 };
}

export function createMap4_B(): MapDef {
  const cols = 22;
  const rows = 16;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const waypoints: Vec2[] = [
    { x: 0, y: 1 },
    { x: 4, y: 1 },
    { x: 4, y: 6 },
    { x: 1, y: 6 },
    { x: 1, y: 11 },
    { x: 7, y: 11 },
    { x: 7, y: 3 },
    { x: 12, y: 3 },
    { x: 12, y: 13 },
    { x: 17, y: 13 },
    { x: 17, y: 6 },
    { x: 21, y: 6 },
  ];

  markPathOnGrid(buildable, waypoints);
  return { cols, rows, tileSize, waypoints, buildable, cameraDistance: 26 };
}

export function createMapHeatDeath(): MapDef {
  const cols = 24;
  const rows = 16;
  const tileSize = 1;
  const buildable = createEmptyGrid(rows, cols);

  const pathA: Vec2[] = [
    { x: 0, y: 2 }, { x: 6, y: 2 }, { x: 6, y: 6 },
    { x: 12, y: 6 }, { x: 12, y: 8 }, { x: 23, y: 8 },
  ];
  const pathB: Vec2[] = [
    { x: 0, y: 7 }, { x: 4, y: 7 }, { x: 4, y: 8 },
    { x: 12, y: 8 }, { x: 23, y: 8 },
  ];
  const pathC: Vec2[] = [
    { x: 0, y: 13 }, { x: 6, y: 13 }, { x: 6, y: 10 },
    { x: 12, y: 10 }, { x: 12, y: 8 }, { x: 23, y: 8 },
  ];

  markPathOnGrid(buildable, pathA);
  markPathOnGrid(buildable, pathB);
  markPathOnGrid(buildable, pathC);

  return {
    cols, rows, tileSize,
    waypoints: pathA,
    paths: [pathA, pathB, pathC],
    buildable,
    cameraDistance: 28,
  };
}
