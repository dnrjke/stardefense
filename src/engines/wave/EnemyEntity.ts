import * as BABYLON from '@babylonjs/core';
import type { EnemyDef } from '@/shared/data/EnemyData';

export class EnemyEntity {
  readonly def: EnemyDef;
  hp: number;
  alive = true;
  mesh: BABYLON.Mesh;

  private waypoints: BABYLON.Vector3[];
  private waypointIndex = 0;
  private readonly speed: number;
  private prevPos: BABYLON.Vector3;
  private nextPos: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, def: EnemyDef, waypoints: BABYLON.Vector3[]) {
    this.def = def;
    this.hp = def.hp;
    this.speed = def.speed;
    this.waypoints = waypoints;

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`enemy_${def.id}_${Math.random().toString(36).slice(2, 6)}`, {
      diameter: def.radius * 2,
    }, scene);
    this.mesh.position.copyFrom(waypoints[0]);
    this.mesh.position.y = 0.3;

    const mat = new BABYLON.StandardMaterial(`enemyMat_${this.mesh.name}`, scene);
    if (def.id === 'asteroid') {
      mat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4);
    } else if (def.id === 'comet') {
      mat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 1.0);
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.5);
    } else if (def.id === 'rogue_planet') {
      mat.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.15);
    }
    this.mesh.material = mat;
    this.mesh.isPickable = false;

    this.prevPos = waypoints[0].clone();
    this.nextPos = waypoints[0].clone();
    this.waypointIndex = 1;
  }

  get position(): BABYLON.Vector3 { return this.mesh.position; }

  fixedUpdate(dt: number): boolean {
    if (!this.alive) return false;
    if (this.waypointIndex >= this.waypoints.length) {
      return true; // reached end
    }

    this.prevPos.copyFrom(this.mesh.position);

    const target = this.waypoints[this.waypointIndex];
    const dir = target.subtract(this.mesh.position);
    dir.y = 0;
    const dist = dir.length();
    const step = this.speed * dt;

    if (dist <= step) {
      this.mesh.position.x = target.x;
      this.mesh.position.z = target.z;
      this.waypointIndex++;
      if (this.waypointIndex >= this.waypoints.length) {
        return true;
      }
    } else {
      dir.normalize();
      this.mesh.position.x += dir.x * step;
      this.mesh.position.z += dir.z * step;
    }

    this.nextPos.copyFrom(this.mesh.position);
    return false;
  }

  interpolate(alpha: number) {
    if (!this.alive) return;
    this.mesh.position.x = this.prevPos.x + (this.nextPos.x - this.prevPos.x) * alpha;
    this.mesh.position.z = this.prevPos.z + (this.nextPos.z - this.prevPos.z) * alpha;
  }

  takeDamage(amount: number): boolean {
    const effective = Math.max(1, amount - this.def.armor);
    this.hp -= effective;
    if (this.hp <= 0) {
      this.alive = false;
      this.mesh.dispose();
      return true;
    }
    return false;
  }

  dispose() {
    this.mesh.dispose();
  }
}
