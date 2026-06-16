import * as BABYLON from '@babylonjs/core';
import type { MapDef, Vec2 } from '@/shared/data/MapData';

export class MapEngine {
  private mapDef: MapDef;
  private scene: BABYLON.Scene;
  private tileMeshes: BABYLON.Mesh[][] = [];
  private pathMeshes: BABYLON.Mesh[] = [];
  private pathPoints: BABYLON.Vector3[] = [];

  constructor(scene: BABYLON.Scene, mapDef: MapDef) {
    this.scene = scene;
    this.mapDef = mapDef;
    this.buildPathPoints();
    this.buildVisuals();
  }

  private buildPathPoints() {
    for (const wp of this.mapDef.waypoints) {
      this.pathPoints.push(new BABYLON.Vector3(
        wp.x - this.mapDef.cols / 2 + 0.5,
        0.01,
        -(wp.y - this.mapDef.rows / 2 + 0.5),
      ));
    }
  }

  private buildVisuals() {
    const { cols, rows, buildable } = this.mapDef;
    const halfC = cols / 2;
    const halfR = rows / 2;

    const buildableMat = new BABYLON.StandardMaterial('tileBuildable', this.scene);
    buildableMat.diffuseColor = new BABYLON.Color3(0.08, 0.08, 0.15);
    buildableMat.specularColor = BABYLON.Color3.Black();

    const pathMat = new BABYLON.StandardMaterial('tilePath', this.scene);
    pathMat.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.25);
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
        tile.isPickable = buildable[r][c];
        tile.metadata = { type: 'tile', row: r, col: c };
        this.tileMeshes[r][c] = tile;
      }
    }

    // Path line
    const linePoints = this.pathPoints.map(p => new BABYLON.Vector3(p.x, 0.02, p.z));
    const pathLine = BABYLON.MeshBuilder.CreateLines('pathLine', {
      points: linePoints,
    }, this.scene);
    pathLine.color = new BABYLON.Color3(0.3, 0.25, 0.5);
    this.pathMeshes.push(pathLine);

    // Spawn marker
    const spawn = BABYLON.MeshBuilder.CreateSphere('spawnMarker', { diameter: 0.4 }, this.scene);
    spawn.position.copyFrom(this.pathPoints[0]);
    spawn.position.y = 0.2;
    const spawnMat = new BABYLON.StandardMaterial('spawnMat', this.scene);
    spawnMat.diffuseColor = new BABYLON.Color3(1, 0.3, 0.3);
    spawnMat.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    spawn.material = spawnMat;
    spawn.isPickable = false;

    // Base marker
    const base = BABYLON.MeshBuilder.CreateSphere('baseMarker', { diameter: 0.5 }, this.scene);
    base.position.copyFrom(this.pathPoints[this.pathPoints.length - 1]);
    base.position.y = 0.25;
    const baseMat = new BABYLON.StandardMaterial('baseMat', this.scene);
    baseMat.diffuseColor = new BABYLON.Color3(0.3, 0.5, 1);
    baseMat.emissiveColor = new BABYLON.Color3(0.1, 0.2, 0.5);
    base.material = baseMat;
    base.isPickable = false;
  }

  getWaypoints(): BABYLON.Vector3[] {
    return this.pathPoints;
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

  getMapDef(): MapDef { return this.mapDef; }
}
