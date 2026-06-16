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
  private hpBar: BABYLON.Mesh | null = null;
  private hpBarBg: BABYLON.Mesh | null = null;
  private readonly hpBarWidth = 0.6;

  constructor(scene: BABYLON.Scene, def: EnemyDef, waypoints: BABYLON.Vector3[]) {
    this.def = def;
    this.hp = def.hp;
    this.speed = def.speed;
    this.waypoints = waypoints;

    this.mesh = BABYLON.MeshBuilder.CreateSphere(`enemy_${def.id}_${Math.random().toString(36).slice(2, 6)}`, {
      diameter: def.radius * 2,
      segments: 12,
    }, scene);
    this.mesh.position.copyFrom(waypoints[0]);
    this.mesh.position.y = 0.3;

    const mat = new BABYLON.StandardMaterial(`enemyMat_${this.mesh.name}`, scene);
    if (def.id === 'asteroid') {
      mat.diffuseColor = new BABYLON.Color3(0.7, 0.55, 0.35);
      mat.emissiveColor = new BABYLON.Color3(0.15, 0.1, 0.05);
    } else if (def.id === 'comet') {
      mat.diffuseColor = new BABYLON.Color3(0.4, 0.85, 1.0);
      mat.emissiveColor = new BABYLON.Color3(0.15, 0.4, 0.6);
    } else if (def.id === 'rogue_planet') {
      mat.diffuseColor = new BABYLON.Color3(0.4, 0.25, 0.15);
      mat.emissiveColor = new BABYLON.Color3(0.1, 0.05, 0.02);
    }
    this.mesh.material = mat;
    this.mesh.isPickable = false;

    // HP bar background (dark)
    this.hpBarBg = BABYLON.MeshBuilder.CreatePlane(`hpBg_${this.mesh.name}`, {
      width: this.hpBarWidth,
      height: 0.08,
    }, scene);
    this.hpBarBg.rotation.x = Math.PI / 2;
    this.hpBarBg.position.y = 0.02;
    this.hpBarBg.parent = this.mesh;
    this.hpBarBg.position.z = -(def.radius + 0.12);
    const bgMat = new BABYLON.StandardMaterial(`hpBgMat_${this.mesh.name}`, scene);
    bgMat.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    bgMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    bgMat.specularColor = BABYLON.Color3.Black();
    this.hpBarBg.material = bgMat;
    this.hpBarBg.isPickable = false;

    // HP bar foreground (green → red)
    this.hpBar = BABYLON.MeshBuilder.CreatePlane(`hpFg_${this.mesh.name}`, {
      width: this.hpBarWidth,
      height: 0.06,
    }, scene);
    this.hpBar.rotation.x = Math.PI / 2;
    this.hpBar.position.y = 0.025;
    this.hpBar.parent = this.mesh;
    this.hpBar.position.z = -(def.radius + 0.12);
    const fgMat = new BABYLON.StandardMaterial(`hpFgMat_${this.mesh.name}`, scene);
    fgMat.diffuseColor = new BABYLON.Color3(0.2, 0.9, 0.3);
    fgMat.emissiveColor = new BABYLON.Color3(0.1, 0.4, 0.1);
    fgMat.specularColor = BABYLON.Color3.Black();
    this.hpBar.material = fgMat;
    this.hpBar.isPickable = false;

    this.prevPos = waypoints[0].clone();
    this.nextPos = waypoints[0].clone();
    this.waypointIndex = 1;
  }

  get position(): BABYLON.Vector3 { return this.mesh.position; }

  fixedUpdate(dt: number): boolean {
    if (!this.alive) return false;
    if (this.waypointIndex >= this.waypoints.length) {
      return true;
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

    // Update HP bar
    const ratio = Math.max(0, this.hp / this.def.hp);
    if (this.hpBar) {
      this.hpBar.scaling.x = ratio;
      this.hpBar.position.x = -(this.hpBarWidth * (1 - ratio)) / 2;
      const mat = this.hpBar.material as BABYLON.StandardMaterial;
      // Green → Yellow → Red
      mat.diffuseColor.r = ratio < 0.5 ? 0.9 : 0.2 + (1 - ratio) * 1.4;
      mat.diffuseColor.g = ratio > 0.5 ? 0.9 : ratio * 1.8;
      mat.emissiveColor.r = mat.diffuseColor.r * 0.4;
      mat.emissiveColor.g = mat.diffuseColor.g * 0.4;
    }

    if (this.hp <= 0) {
      this.alive = false;
      this.dispose();
      return true;
    }
    return false;
  }

  dispose() {
    this.hpBar?.dispose();
    this.hpBarBg?.dispose();
    this.mesh.dispose();
  }
}
