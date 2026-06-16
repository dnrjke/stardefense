import * as BABYLON from '@babylonjs/core';
import type { EnemyEntity } from '@/engines/wave/EnemyEntity';

export class Projectile {
  mesh: BABYLON.Mesh;
  target: EnemyEntity;
  damage: number;
  speed: number;
  alive = true;
  private prevPos: BABYLON.Vector3;
  private nextPos: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, origin: BABYLON.Vector3, target: EnemyEntity, damage: number, speed: number, color: BABYLON.Color3) {
    this.target = target;
    this.damage = damage;
    this.speed = speed;

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`proj_${Math.random().toString(36).slice(2, 6)}`, {
      diameter: 0.15,
    }, scene);
    this.mesh.position.copyFrom(origin);
    this.mesh.position.y = 0.3;

    const mat = new BABYLON.StandardMaterial(`projMat_${this.mesh.name}`, scene);
    mat.emissiveColor = color;
    mat.disableLighting = true;
    this.mesh.material = mat;
    this.mesh.isPickable = false;

    this.prevPos = this.mesh.position.clone();
    this.nextPos = this.mesh.position.clone();
  }

  fixedUpdate(dt: number): boolean {
    if (!this.alive) return false;

    if (!this.target.alive) {
      this.alive = false;
      this.mesh.dispose();
      return false;
    }

    this.prevPos.copyFrom(this.mesh.position);

    const dir = this.target.position.subtract(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    const step = this.speed * dt;

    if (dist <= step + this.target.def.radius) {
      this.alive = false;
      this.mesh.dispose();
      return true; // hit
    }

    dir.normalize();
    this.mesh.position.x += dir.x * step;
    this.mesh.position.z += dir.z * step;

    this.nextPos.copyFrom(this.mesh.position);
    return false;
  }

  interpolate(alpha: number) {
    if (!this.alive) return;
    this.mesh.position.x = this.prevPos.x + (this.nextPos.x - this.prevPos.x) * alpha;
    this.mesh.position.z = this.prevPos.z + (this.nextPos.z - this.prevPos.z) * alpha;
  }

  dispose() {
    if (this.alive) {
      this.alive = false;
      this.mesh.dispose();
    }
  }
}
