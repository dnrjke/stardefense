import * as BABYLON from '@babylonjs/core';
import type { TowerDef } from '@/shared/data/TowerData';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';
import { Projectile } from './Projectile';
import { ciToRgb } from '@/shared/data/ColorUtil';

export class TowerEntity {
  readonly def: TowerDef;
  readonly row: number;
  readonly col: number;
  mesh: BABYLON.Mesh;

  private scene: BABYLON.Scene;
  private attackCooldown = 0;
  private color: BABYLON.Color3;
  private rangeSq: number;

  constructor(scene: BABYLON.Scene, def: TowerDef, worldPos: BABYLON.Vector3, row: number, col: number) {
    this.scene = scene;
    this.def = def;
    this.row = row;
    this.col = col;
    this.rangeSq = def.range * def.range;

    const [r, g, b] = ciToRgb(def.ci);
    this.color = new BABYLON.Color3(r, g, b);

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`tower_${def.id}_${row}_${col}`, {
      diameter: 0.6,
      segments: 16,
    }, scene);
    this.mesh.position.copyFrom(worldPos);
    this.mesh.position.y = 0.35;

    const mat = new BABYLON.StandardMaterial(`towerMat_${this.mesh.name}`, scene);
    mat.diffuseColor = this.color;
    mat.emissiveColor = this.color.scale(0.4);
    mat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    this.mesh.material = mat;
    this.mesh.isPickable = false;

    // Range indicator (ground circle)
    const rangeDisc = BABYLON.MeshBuilder.CreateDisc(`range_${this.mesh.name}`, {
      radius: def.range,
      tessellation: 48,
    }, scene);
    rangeDisc.rotation.x = Math.PI / 2;
    rangeDisc.position.copyFrom(worldPos);
    rangeDisc.position.y = 0.005;
    const rangeMat = new BABYLON.StandardMaterial(`rangeMat_${this.mesh.name}`, scene);
    rangeMat.diffuseColor = this.color.scale(0.15);
    rangeMat.emissiveColor = this.color.scale(0.05);
    rangeMat.alpha = 0.3;
    rangeMat.specularColor = BABYLON.Color3.Black();
    rangeDisc.material = rangeMat;
    rangeDisc.isPickable = false;
  }

  fixedUpdate(dt: number, enemies: EnemyEntity[]): Projectile | null {
    this.attackCooldown -= dt;
    if (this.attackCooldown > 0) return null;

    let closest: EnemyEntity | null = null;
    let closestDistSq = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.position.x - this.mesh.position.x;
      const dz = enemy.position.z - this.mesh.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq <= this.rangeSq && distSq < closestDistSq) {
        closest = enemy;
        closestDistSq = distSq;
      }
    }

    if (!closest) return null;

    this.attackCooldown = 1 / this.def.attackRate;
    return new Projectile(
      this.scene,
      this.mesh.position,
      closest,
      this.def.damage,
      this.def.projectileSpeed,
      this.color,
    );
  }

  dispose() {
    this.mesh.dispose();
  }
}
