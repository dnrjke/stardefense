import * as BABYLON from '@babylonjs/core';
import { displayMode } from '@/shared/ui/DisplayMode';

export function worldToScreen(
  worldPos: BABYLON.Vector3,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine,
): { x: number; y: number } {
  const cam = scene.activeCamera!;
  const projected = BABYLON.Vector3.Project(
    worldPos,
    BABYLON.Matrix.Identity(),
    scene.getTransformMatrix(),
    cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()),
  );
  const dpr = engine.getHardwareScalingLevel();
  const rect = engine.getRenderingCanvas()!.getBoundingClientRect();

  const lx = projected.x * dpr;
  const ly = projected.y * dpr;

  if (displayMode.rotation === 0) {
    return { x: lx + rect.left, y: ly + rect.top };
  }

  // CSS rotate(90deg) CW 보정
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 회전 후 rect의 가로세로가 교환됨
  const origW = rect.height;
  const origH = rect.width;

  const dx = lx - origW / 2;
  const dy = ly - origH / 2;

  // 90° CW: (dx, dy) → (-dy, dx)
  return {
    x: cx + (-dy),
    y: cy + dx,
  };
}
