import * as BABYLON from '@babylonjs/core';
import type { MapDef, Vec2 } from '@/shared/data/MapData';

export class MapEngine {
  private mapDef: MapDef;
  private scene: BABYLON.Scene;
  private tileMeshes: BABYLON.Mesh[][] = [];
  private pathMeshes: BABYLON.Mesh[] = [];
  private allPaths: BABYLON.Vector3[][] = [];

  constructor(scene: BABYLON.Scene, mapDef: MapDef) {
    this.scene = scene;
    this.mapDef = mapDef;
    this.buildAllPaths();
    this.buildVisuals();
  }

  private vec2ToWorld(wp: Vec2): BABYLON.Vector3 {
    return new BABYLON.Vector3(
      wp.x - this.mapDef.cols / 2 + 0.5,
      0.01,
      -(wp.y - this.mapDef.rows / 2 + 0.5),
    );
  }

  private buildAllPaths() {
    if (this.mapDef.paths && this.mapDef.paths.length > 0) {
      for (const path of this.mapDef.paths) {
        this.allPaths.push(path.map(wp => this.vec2ToWorld(wp)));
      }
    } else {
      this.allPaths.push(this.mapDef.waypoints.map(wp => this.vec2ToWorld(wp)));
    }
  }

  private buildVisuals() {
    const { cols, rows, buildable } = this.mapDef;
    const halfC = cols / 2;
    const halfR = rows / 2;

    const buildableMat = new BABYLON.StandardMaterial('tileBuildable', this.scene);
    buildableMat.diffuseColor = new BABYLON.Color3(0.06, 0.06, 0.12);
    buildableMat.emissiveColor = new BABYLON.Color3(0.02, 0.02, 0.06);
    buildableMat.specularColor = BABYLON.Color3.Black();

    const pathMat = new BABYLON.StandardMaterial('tilePath', this.scene);
    pathMat.diffuseColor = new BABYLON.Color3(0.10, 0.08, 0.20);
    pathMat.emissiveColor = new BABYLON.Color3(0.04, 0.03, 0.10);
    pathMat.specularColor = BABYLON.Color3.Black();

    for (let r = 0; r < rows; r++) {
      this.tileMeshes[r] = [];
      for (let c = 0; c < cols; c++) {
        const tile = BABYLON.MeshBuilder.CreateGround(`tile_${r}_${c}`, {
          width: 0.95,
          height: 0.95,
        }, this.scene);
        tile.position.x = c - halfC + 0.5;
        tile.position.z = -(r - halfR + 0.5);
        tile.position.y = 0;
        tile.material = buildable[r][c] ? buildableMat : pathMat;
        tile.isPickable = true;
        tile.metadata = { type: 'tile', row: r, col: c };
        this.tileMeshes[r][c] = tile;
      }
    }

    const pathColors = [
      new BABYLON.Color3(0.3, 0.25, 0.5),
      new BABYLON.Color3(0.5, 0.25, 0.3),
      new BABYLON.Color3(0.25, 0.5, 0.3),
    ];

    for (let i = 0; i < this.allPaths.length; i++) {
      const points = this.allPaths[i];
      const linePoints = points.map(p => new BABYLON.Vector3(p.x, 0.02, p.z));
      const pathLine = BABYLON.MeshBuilder.CreateLines(`pathLine_${i}`, {
        points: linePoints,
      }, this.scene);
      pathLine.color = pathColors[i % pathColors.length];
      this.pathMeshes.push(pathLine);
    }

    const spawnPositions = new Set<string>();
    let basePos: BABYLON.Vector3 | null = null;

    for (const path of this.allPaths) {
      const spawnKey = `${path[0].x},${path[0].z}`;
      if (!spawnPositions.has(spawnKey)) {
        spawnPositions.add(spawnKey);
        const spawn = BABYLON.MeshBuilder.CreateSphere(`spawnMarker_${spawnPositions.size}`, { diameter: 0.4 }, this.scene);
        spawn.position.copyFrom(path[0]);
        spawn.position.y = 0.2;
        const spawnMat = new BABYLON.StandardMaterial(`spawnMat_${spawnPositions.size}`, this.scene);
        spawnMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
        spawnMat.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
        spawn.material = spawnMat;
        spawn.isPickable = false;
      }
      basePos = path[path.length - 1];
    }

    if (basePos) {
      const base = BABYLON.MeshBuilder.CreateSphere('baseMarker', { diameter: 0.5 }, this.scene);
      base.position.copyFrom(basePos);
      base.position.y = 0.25;
      const baseMat = new BABYLON.StandardMaterial('baseMat', this.scene);
      baseMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 1);
      baseMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
      base.material = baseMat;
      base.isPickable = false;
    }
  }

  getWaypoints(pathIndex?: number): BABYLON.Vector3[] {
    const idx = pathIndex ?? 0;
    return this.allPaths[idx] ?? this.allPaths[0];
  }

  get pathCount(): number {
    return this.allPaths.length;
  }

  tileToWorld(row: number, col: number): BABYLON.Vector3 {
    const { cols, rows } = this.mapDef;
    return new BABYLON.Vector3(
      col - cols / 2 + 0.5,
      0,
      -(row - rows / 2 + 0.5),
    );
  }

  isBuildable(row: number, col: number): boolean {
    return this.mapDef.buildable[row]?.[col] === true;
  }

  markOccupied(row: number, col: number) {
    this.mapDef.buildable[row][col] = false;
    const tile = this.tileMeshes[row]?.[col];
    if (tile) tile.isPickable = false;
  }

  markBuildable(row: number, col: number) {
    this.mapDef.buildable[row][col] = true;
    const tile = this.tileMeshes[row]?.[col];
    if (tile) tile.isPickable = true;
  }

  getMapDef(): MapDef { return this.mapDef; }
}
